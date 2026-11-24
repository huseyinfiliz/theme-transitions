import { clampInt, isDarkTheme, parseTransformTranslation, resolveEasing, resolveOriginPoint } from './catalog';
import { getCachedEffect, loadEffect } from './loader';
import type { ReverseMode, SnapshotViewportBounds, TransitionConfig, TransitionContext, TransitionEffectFn, TransitionPoint } from './types';

export interface RunTransitionOptions {
  config: TransitionConfig;
  triggerPoint?: TransitionPoint | null;
  fromTheme: string;
  toTheme: string;
  applyDomChange: () => void;
}

interface PreTransitionMetrics {
  anchorLeft: number;
  anchorTop: number;
  visWidth: number;
  visHeight: number;
  vvOffsetLeft: number;
  vvOffsetTop: number;
}

let restoreFrame: number | undefined;
let restoreTimer: ReturnType<typeof setTimeout> | undefined;
let activeTransition: ViewTransition | null = null;
let activeAnimations: Animation[] = [];
let activeRootClasses: string[] = [];
let activeAnchor: HTMLDivElement | null = null;
let alternateCounter = 0;
let transitionToken = 0;

function removeAnchors(): void {
  if (activeAnchor) {
    try {
      activeAnchor.remove();
    } catch {
      // Ignore already detached nodes.
    }
    activeAnchor = null;
  }

  if (typeof document !== 'undefined') {
    document.querySelectorAll('[data-tt-viewport-anchor]').forEach((el) => {
      try {
        el.remove();
      } catch {
        // Ignore removal errors.
      }
    });
  }
}

function cleanupRootClasses(): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const classesToRemove = new Set(['tt-transitioning', 'tt-reverse', 'tt-respect-reduced-motion', 'tt-perspective', ...activeRootClasses]);

  classesToRemove.forEach((cls) => root.classList.remove(cls));
  activeRootClasses = [];
}

function cleanupActiveTransition(skip = true): void {
  for (const animation of activeAnimations) {
    try {
      animation.cancel();
    } catch {
      // Ignore already-finished animations.
    }
  }
  activeAnimations = [];

  if (skip && activeTransition && typeof activeTransition.skipTransition === 'function') {
    try {
      activeTransition.skipTransition();
    } catch {
      // Ignore already-finished transitions.
    }
  }
  activeTransition = null;

  removeAnchors();
  cleanupRootClasses();
}

export function suppressCssTransitions(callback: () => void): void {
  if (typeof document === 'undefined') {
    callback();
    return;
  }

  const root = document.documentElement;

  if (typeof cancelAnimationFrame === 'function' && restoreFrame !== undefined) {
    cancelAnimationFrame(restoreFrame);
  }
  if (restoreTimer !== undefined) {
    clearTimeout(restoreTimer);
  }

  root.classList.add('tt-no-transition');

  try {
    callback();
  } finally {
    // Force reflow so property updates paint without CSS transitions before restoring.
    void root.offsetHeight;

    const scheduleRemove = () => {
      restoreTimer = setTimeout(() => {
        root.classList.remove('tt-no-transition');
        restoreTimer = undefined;
      }, 0);
    };

    if (typeof requestAnimationFrame === 'function') {
      restoreFrame = requestAnimationFrame(() => {
        restoreFrame = undefined;
        scheduleRemove();
      });
    } else {
      scheduleRemove();
    }
  }
}

export function shouldAnimate(config: TransitionConfig): boolean {
  if (!config.enabled) {
    return false;
  }

  if (typeof document === 'undefined' || typeof document.startViewTransition !== 'function') {
    return false;
  }

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    if (config.respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }

    if (config.disableOnMobile && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(max-width: 767px)').matches)) {
      return false;
    }
  }

  return true;
}

export function computeReversed(mode: ReverseMode, fromDark: boolean, toDark: boolean, currentAlternateCounter: number): boolean {
  switch (mode) {
    case 'on-light':
      return fromDark && !toDark;
    case 'on-dark':
      return !fromDark && toDark;
    case 'alternate':
      return currentAlternateCounter % 2 === 1;
    case 'none':
    default:
      return false;
  }
}

function parsePx(value: string | null | undefined): number {
  if (!value) return 0;
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : 0;
}

function mountViewportAnchor(root: HTMLElement): PreTransitionMetrics {
  const anchor = document.createElement('div');
  anchor.setAttribute('data-tt-viewport-anchor', 'true');
  anchor.setAttribute('aria-hidden', 'true');
  anchor.style.cssText =
    'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;contain:strict;view-transition-name:tt-viewport-anchor;';

  (document.body || root).appendChild(anchor);
  activeAnchor = anchor;

  const rect = typeof anchor.getBoundingClientRect === 'function' ? anchor.getBoundingClientRect() : { left: 0, top: 0 };
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  const innerW = typeof window !== 'undefined' ? window.innerWidth || 0 : 0;
  const innerH = typeof window !== 'undefined' ? window.innerHeight || 0 : 0;

  return {
    anchorLeft: Number.isFinite(rect.left) ? rect.left : 0,
    anchorTop: Number.isFinite(rect.top) ? rect.top : 0,
    visWidth: (vv && vv.width > 0 ? vv.width : Math.max(root.clientWidth || 0, innerW)) || 1,
    visHeight: (vv && vv.height > 0 ? vv.height : Math.max(root.clientHeight || 0, innerH)) || 1,
    vvOffsetLeft: vv && Number.isFinite(vv.offsetLeft) ? vv.offsetLeft : 0,
    vvOffsetTop: vv && Number.isFinite(vv.offsetTop) ? vv.offsetTop : 0,
  };
}

function measureSnapshotBounds(root: HTMLElement, pre: PreTransitionMetrics): SnapshotViewportBounds {
  const innerW = typeof window !== 'undefined' ? window.innerWidth || 0 : 0;
  const innerH = typeof window !== 'undefined' ? window.innerHeight || 0 : 0;

  let offsetX = 0;
  let offsetY = 0;
  let rootNewW = 0;
  let rootNewH = 0;
  let rootGroupW = 0;
  let rootGroupH = 0;
  let vtW = 0;
  let vtH = 0;

  if (typeof getComputedStyle === 'function') {
    const vtStyle = getComputedStyle(root, '::view-transition');
    const rootGroupStyle = getComputedStyle(root, '::view-transition-group(root)');
    const rootNewStyle = getComputedStyle(root, '::view-transition-new(root)');
    const anchorGroupStyle = getComputedStyle(root, '::view-transition-group(tt-viewport-anchor)');

    vtW = parsePx(vtStyle.width);
    vtH = parsePx(vtStyle.height);
    rootGroupW = parsePx(rootGroupStyle.width);
    rootGroupH = parsePx(rootGroupStyle.height);
    rootNewW = parsePx(rootNewStyle.width);
    rootNewH = parsePx(rootNewStyle.height);

    const hasAnchorPseudo =
      (anchorGroupStyle.width !== '' && anchorGroupStyle.width !== 'auto') ||
      (anchorGroupStyle.transform && anchorGroupStyle.transform.includes('matrix')) ||
      (anchorGroupStyle.top !== '' && anchorGroupStyle.top !== 'auto') ||
      (anchorGroupStyle.left !== '' && anchorGroupStyle.left !== 'auto');

    if (hasAnchorPseudo) {
      const anchorT = parseTransformTranslation(anchorGroupStyle.transform);
      const rootT = parseTransformTranslation(rootGroupStyle.transform);
      const anchorX = parsePx(anchorGroupStyle.left) + anchorT.x;
      const anchorY = parsePx(anchorGroupStyle.top) + anchorT.y;
      const rootX = parsePx(rootGroupStyle.left) + rootT.x;
      const rootY = parsePx(rootGroupStyle.top) + rootT.y;

      offsetX = anchorX - rootX - pre.anchorLeft;
      offsetY = anchorY - rootY - pre.anchorTop;
    }
  }

  const visibleLeftRaw = Math.abs(pre.anchorLeft) > 0.5 ? offsetX : offsetX + pre.vvOffsetLeft;
  const visibleTopRaw = Math.abs(pre.anchorTop) > 0.5 ? offsetY : offsetY + pre.vvOffsetTop;

  const width = Math.max(rootNewW, rootGroupW, vtW, visibleLeftRaw + pre.visWidth, root.clientWidth || 0, innerW) || 1;
  const height = Math.max(rootNewH, rootGroupH, vtH, visibleTopRaw + pre.visHeight, root.clientHeight || 0, innerH) || 1;

  const visibleLeft = Math.min(width, Math.max(0, visibleLeftRaw));
  const visibleTop = Math.min(height, Math.max(0, visibleTopRaw));
  const visibleWidth = Math.min(width - visibleLeft, Math.max(1, pre.visWidth));
  const visibleHeight = Math.min(height - visibleTop, Math.max(1, pre.visHeight));

  return {
    width,
    height,
    visibleLeft,
    visibleTop,
    visibleWidth,
    visibleHeight,
    offsetX,
    offsetY,
  };
}

function buildContext(
  bounds: SnapshotViewportBounds,
  config: TransitionConfig,
  triggerPoint: TransitionPoint | null,
  duration: number,
  easing: string,
  reversed: boolean,
  fromDark: boolean,
  toDark: boolean
): TransitionContext {
  const { x, y } = resolveOriginPoint(config.origin, bounds, triggerPoint);

  return {
    width: bounds.width,
    height: bounds.height,
    visibleLeft: bounds.visibleLeft,
    visibleTop: bounds.visibleTop,
    visibleWidth: bounds.visibleWidth,
    visibleHeight: bounds.visibleHeight,
    x,
    y,
    duration,
    easing,
    direction: config.direction,
    reversed,
    fromDark,
    toDark,
    blindsCount: clampInt(config.blindsCount, 3, 24, 8),
    blurAmount: clampInt(config.blurAmount, 2, 32, 12),
  };
}

function runWithEffectFn(effectFn: TransitionEffectFn, options: RunTransitionOptions, token: number): Promise<void> {
  if (token !== transitionToken) {
    options.applyDomChange();
    return Promise.resolve();
  }

  cleanupActiveTransition(true);

  const { config, triggerPoint = null, fromTheme, toTheme, applyDomChange } = options;
  const root = document.documentElement;
  const fromDark = isDarkTheme(fromTheme);
  const toDark = isDarkTheme(toTheme);
  const reversed = computeReversed(config.reverseMode, fromDark, toDark, alternateCounter);

  if (config.reverseMode === 'alternate') {
    alternateCounter++;
  }

  const duration = clampInt(config.duration, 100, 2000, 480);
  const easing = resolveEasing(config.easing, config.customEasing);

  const pre = mountViewportAnchor(root);
  const prelimBounds: SnapshotViewportBounds = {
    width: pre.visWidth,
    height: pre.visHeight,
    visibleLeft: 0,
    visibleTop: 0,
    visibleWidth: pre.visWidth,
    visibleHeight: pre.visHeight,
    offsetX: 0,
    offsetY: 0,
  };

  // Evaluate preliminary plan only for pre-snapshot root classes (tt-reverse, tt-perspective).
  const prelimPlan = effectFn(buildContext(prelimBounds, config, triggerPoint, duration, easing, reversed, fromDark, toDark));

  const classes = ['tt-transitioning'];
  if (prelimPlan.reverseStack) classes.push('tt-reverse');
  if (config.respectReducedMotion) classes.push('tt-respect-reduced-motion');
  if (prelimPlan.rootClasses) {
    for (const cls of prelimPlan.rootClasses) {
      if (cls) classes.push(cls);
    }
  }

  activeRootClasses = classes;
  classes.forEach((cls) => root.classList.add(cls));

  let transition: ViewTransition;

  try {
    // Invoke startViewTransition synchronously so the old snapshot is captured
    // before Mithril flushes any pending DOM updates.
    transition = document.startViewTransition(() => {
      suppressCssTransitions(() => {
        applyDomChange();

        if (typeof m !== 'undefined' && m.redraw && typeof m.redraw.sync === 'function') {
          m.redraw.sync();
        }
      });
    });
  } catch {
    cleanupActiveTransition(false);
    applyDomChange();
    return Promise.resolve();
  }

  activeTransition = transition;

  return Promise.resolve(transition.ready)
    .then(() => {
      if (token !== transitionToken) {
        return;
      }

      const exactBounds = measureSnapshotBounds(root, pre);
      const exactCtx = buildContext(exactBounds, config, triggerPoint, duration, easing, reversed, fromDark, toDark);
      const plan = effectFn(exactCtx);

      if (typeof root.animate === 'function') {
        activeAnimations = plan.animations.map((spec) =>
          root.animate(spec.keyframes, {
            duration,
            easing,
            fill: 'both',
            pseudoElement: spec.pseudoElement,
            ...spec.options,
          })
        );

        return Promise.all(activeAnimations.map((anim) => anim.finished.catch(() => undefined))).then(() => undefined);
      }

      return undefined;
    })
    .then(() => Promise.resolve(transition.finished).catch(() => undefined))
    .catch(() => {
      try {
        transition.skipTransition?.();
      } catch {
        // Ignore skip errors.
      }
    })
    .finally(() => {
      if (token === transitionToken) {
        cleanupActiveTransition(false);
      }
    });
}

export function runThemeTransitionSyncOrAsync(options: RunTransitionOptions): Promise<void> {
  if (!shouldAnimate(options.config)) {
    options.applyDomChange();
    return Promise.resolve();
  }

  const token = ++transitionToken;
  const cached = getCachedEffect(options.config.effect);

  if (cached) {
    return runWithEffectFn(cached, options, token);
  }

  return loadEffect(options.config.effect)
    .then((effectFn) => runWithEffectFn(effectFn, options, token))
    .catch(() => {
      if (token === transitionToken) {
        options.applyDomChange();
      }
    });
}

export function runThemeTransition(options: RunTransitionOptions): Promise<void> {
  return runThemeTransitionSyncOrAsync(options);
}

export function resetEngineStateForTests(): void {
  transitionToken++;
  alternateCounter = 0;
  cleanupActiveTransition(true);
}
