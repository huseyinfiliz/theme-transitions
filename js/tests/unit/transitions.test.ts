import {
  clampInt,
  DEFAULT_CONFIG,
  EASING_PRESETS,
  EFFECT_CATALOG,
  EFFECT_IDS,
  maxCornerRadius,
  parseTransformTranslation,
  resolveEasing,
  resolveOriginPoint,
} from '../../src/common/transitions/catalog';
import { parseConfigFromSettingsMap, SETTINGS_PREFIX } from '../../src/common/transitions/config';
import { resetEngineStateForTests, runThemeTransition, shouldAnimate } from '../../src/common/transitions/engine';
import {
  getRecentTriggerPoint,
  installInteractionTracker,
  resetInteractionTracker,
} from '../../src/common/transitions/interactionTracker';
import { clearEffectCache, loadEffect } from '../../src/common/transitions/loader';
import type { SnapshotViewportBounds, TransitionContext } from '../../src/common/transitions/types';
import fs from 'fs';
import path from 'path';

import runBlinds from '../../src/common/transitions/effects/blinds';
import runBlur from '../../src/common/transitions/effects/blur';
import runCircle from '../../src/common/transitions/effects/circle';
import runCircleBlur from '../../src/common/transitions/effects/circleBlur';
import runCircleShrink from '../../src/common/transitions/effects/circleShrink';
import runDiagonal from '../../src/common/transitions/effects/diagonal';
import runDiamond from '../../src/common/transitions/effects/diamond';
import runFade from '../../src/common/transitions/effects/fade';
import runFlip from '../../src/common/transitions/effects/flip';
import runIris from '../../src/common/transitions/effects/iris';
import runSlide from '../../src/common/transitions/effects/slide';
import runSplit from '../../src/common/transitions/effects/split';
import runWipe from '../../src/common/transitions/effects/wipe';
import runZoom from '../../src/common/transitions/effects/zoom';

function makeBounds(overrides: Partial<SnapshotViewportBounds> = {}): SnapshotViewportBounds {
  return {
    width: 1280,
    height: 720,
    visibleLeft: 0,
    visibleTop: 0,
    visibleWidth: 1280,
    visibleHeight: 720,
    offsetX: 0,
    offsetY: 0,
    ...overrides,
  };
}

function makeCtx(overrides: Partial<TransitionContext> = {}): TransitionContext {
  return {
    width: 1280,
    height: 720,
    visibleLeft: 0,
    visibleTop: 0,
    visibleWidth: 1280,
    visibleHeight: 720,
    x: 640,
    y: 360,
    duration: 480,
    easing: EASING_PRESETS.telegram,
    direction: 'left-to-right',
    reversed: false,
    fromDark: false,
    toDark: true,
    blindsCount: 8,
    blurAmount: 12,
    ...overrides,
  };
}

function countPolygonVertices(clipPath: unknown): number {
  if (typeof clipPath !== 'string') return 0;
  const match = /^polygon\((.+)\)$/.exec(clipPath.trim());
  if (!match) return 0;
  return match[1].split(',').length;
}

describe('catalog helpers', () => {
  test('clampInt clamps within bounds and falls back on non-finite input', () => {
    expect(clampInt(50, 100, 2000, 480)).toBe(100);
    expect(clampInt(5000, 100, 2000, 480)).toBe(2000);
    expect(clampInt('640', 100, 2000, 480)).toBe(640);
    expect(clampInt('abc', 100, 2000, 480)).toBe(480);
    expect(clampInt(undefined, 100, 2000, 480)).toBe(480);
  });

  test('resolveEasing handles built-in presets, valid custom curves, and invalid fallback', () => {
    expect(resolveEasing('telegram', '')).toBe(EASING_PRESETS.telegram);
    expect(resolveEasing('spring', '')).toBe(EASING_PRESETS.spring);
    expect(resolveEasing('custom', 'cubic-bezier(0.2, 0.8, 0.2, 1)')).toBe('cubic-bezier(0.2, 0.8, 0.2, 1)');
    expect(resolveEasing('custom', 'ease-in-out')).toBe('ease-in-out');
    expect(resolveEasing('custom', 'cubic-bezier(2, 0, 0.5, 1)')).toBe(EASING_PRESETS.telegram);
    expect(resolveEasing('custom', 'not-valid')).toBe(EASING_PRESETS.telegram);
  });

  test('parseTransformTranslation parses matrix, matrix3d, none, and invalid values', () => {
    expect(parseTransformTranslation('none')).toEqual({ x: 0, y: 0 });
    expect(parseTransformTranslation('')).toEqual({ x: 0, y: 0 });
    expect(parseTransformTranslation('matrix(1, 0, 0, 1, 12, 56)')).toEqual({ x: 12, y: 56 });
    expect(parseTransformTranslation('matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 8, 64, 0, 1)')).toEqual({ x: 8, y: 64 });
    expect(parseTransformTranslation('invalid')).toEqual({ x: 0, y: 0 });
  });

  test('resolveOriginPoint resolves trigger, center, corners, and null fallback', () => {
    const simpleBounds = makeBounds({ width: 1000, height: 500, visibleWidth: 1000, visibleHeight: 500 });
    expect(resolveOriginPoint('center', simpleBounds, { x: 50, y: 50 })).toEqual({ x: 500, y: 250 });
    expect(resolveOriginPoint('top-left', simpleBounds, { x: 50, y: 50 })).toEqual({ x: 0, y: 0 });
    expect(resolveOriginPoint('top-right', simpleBounds, null)).toEqual({ x: 1000, y: 0 });
    expect(resolveOriginPoint('bottom-left', simpleBounds, null)).toEqual({ x: 0, y: 500 });
    expect(resolveOriginPoint('bottom-right', simpleBounds, null)).toEqual({ x: 1000, y: 500 });
    expect(resolveOriginPoint('trigger', simpleBounds, { x: 120, y: 80 })).toEqual({ x: 120, y: 80 });
    expect(resolveOriginPoint('trigger', simpleBounds, null)).toEqual({ x: 500, y: 250 });
  });

  test('resolveOriginPoint accounts for mobile top/bottom browser chrome offsets', () => {
    const mobileBounds = makeBounds({
      width: 390,
      height: 844,
      visibleLeft: 0,
      visibleTop: 56,
      visibleWidth: 390,
      visibleHeight: 740,
      offsetX: 0,
      offsetY: 56,
    });

    expect(resolveOriginPoint('trigger', mobileBounds, { x: 350, y: 26 })).toEqual({ x: 350, y: 82 });
    expect(resolveOriginPoint('center', mobileBounds, null)).toEqual({ x: 195, y: 426 });
    expect(resolveOriginPoint('top-left', mobileBounds, null)).toEqual({ x: 0, y: 56 });
    expect(resolveOriginPoint('top-right', mobileBounds, null)).toEqual({ x: 390, y: 56 });
    expect(resolveOriginPoint('bottom-left', mobileBounds, null)).toEqual({ x: 0, y: 796 });
    expect(resolveOriginPoint('bottom-right', mobileBounds, null)).toEqual({ x: 390, y: 796 });
  });

  test('maxCornerRadius covers the furthest viewport corner', () => {
    expect(maxCornerRadius(0, 0, 300, 400)).toBe(501);
  });

  test('EFFECT_CATALOG contains all 14 unique effects', () => {
    expect(EFFECT_CATALOG).toHaveLength(14);
    expect(new Set(EFFECT_IDS).size).toBe(14);
  });
});

describe('config parsing', () => {
  test('parseConfigFromSettingsMap uses defaults when empty and clamps/falls back invalid values', () => {
    expect(parseConfigFromSettingsMap({})).toEqual(DEFAULT_CONFIG);

    const parsed = parseConfigFromSettingsMap({
      [`${SETTINGS_PREFIX}enabled`]: '0',
      [`${SETTINGS_PREFIX}effect`]: 'non-existent',
      [`${SETTINGS_PREFIX}duration`]: '99999',
      [`${SETTINGS_PREFIX}easing`]: 'spring',
      [`${SETTINGS_PREFIX}origin`]: 'top-right',
      [`${SETTINGS_PREFIX}direction`]: 'bottom-to-top',
      [`${SETTINGS_PREFIX}reverse_mode`]: 'on-light',
      [`${SETTINGS_PREFIX}blinds_count`]: '1',
      [`${SETTINGS_PREFIX}blur_amount`]: '100',
      [`${SETTINGS_PREFIX}enable_admin`]: '0',
      [`${SETTINGS_PREFIX}disable_on_mobile`]: '1',
      [`${SETTINGS_PREFIX}respect_reduced_motion`]: '0',
    });

    expect(parsed).toEqual({
      ...DEFAULT_CONFIG,
      enabled: false,
      effect: 'circle',
      duration: 2000,
      easing: 'spring',
      origin: 'top-right',
      direction: 'bottom-to-top',
      reverseMode: 'on-light',
      blindsCount: 3,
      blurAmount: 32,
      enableAdmin: false,
      disableOnMobile: true,
      respectReducedMotion: false,
    });
  });
});

describe('all 14 transition effects', () => {
  const effectMap = {
    circle: runCircle,
    'circle-shrink': runCircleShrink,
    'circle-blur': runCircleBlur,
    wipe: runWipe,
    diagonal: runDiagonal,
    split: runSplit,
    diamond: runDiamond,
    iris: runIris,
    blinds: runBlinds,
    fade: runFade,
    blur: runBlur,
    zoom: runZoom,
    slide: runSlide,
    flip: runFlip,
  } as const;

  test.each(Object.entries(effectMap))('%s returns valid animations in forward and reversed modes', (_id, fn) => {
    for (const reversed of [false, true]) {
      const plan = fn(makeCtx({ reversed }));
      expect(Array.isArray(plan.animations)).toBe(true);
      expect(plan.animations.length).toBeGreaterThan(0);

      for (const spec of plan.animations) {
        expect(['::view-transition-new(root)', '::view-transition-old(root)']).toContain(spec.pseudoElement);
        expect(Array.isArray(spec.keyframes) && spec.keyframes.length >= 2).toBe(true);
      }
    }
  });

  test('circle and circle-shrink invert reverseStack defaults', () => {
    const circleFwd = runCircle(makeCtx({ reversed: false }));
    const circleRev = runCircle(makeCtx({ reversed: true }));
    expect(circleFwd.reverseStack).toBeFalsy();
    expect(circleRev.reverseStack).toBe(true);

    const shrinkFwd = runCircleShrink(makeCtx({ reversed: false }));
    const shrinkRev = runCircleShrink(makeCtx({ reversed: true }));
    expect(shrinkFwd.reverseStack).toBe(true);
    expect(shrinkRev.reverseStack).toBeFalsy();
  });

  test('diamond, iris, and blinds produce consistent polygon vertex counts across keyframes', () => {
    const diamond = runDiamond(makeCtx());
    const diamondFrames = diamond.animations[0].keyframes as Array<{ clipPath: string }>;
    expect(countPolygonVertices(diamondFrames[0].clipPath)).toBe(4);
    expect(countPolygonVertices(diamondFrames[1].clipPath)).toBe(4);

    const iris = runIris(makeCtx());
    const irisFrames = iris.animations[0].keyframes as Array<{ clipPath: string }>;
    expect(irisFrames).toHaveLength(3);
    irisFrames.forEach((frame) => {
      expect(countPolygonVertices(frame.clipPath)).toBe(8);
    });

    const blinds = runBlinds(makeCtx({ blindsCount: 10 }));
    const blindsFrames = blinds.animations[0].keyframes as Array<{ clipPath: string }>;
    expect(countPolygonVertices(blindsFrames[0].clipPath)).toBe(40);
    expect(countPolygonVertices(blindsFrames[1].clipPath)).toBe(40);
  });

  test('flip requests perspective root class and pivots around visible center', () => {
    const flip = runFlip(
      makeCtx({
        width: 390,
        height: 844,
        visibleLeft: 0,
        visibleTop: 56,
        visibleWidth: 390,
        visibleHeight: 740,
      })
    );
    expect(flip.rootClasses).toContain('tt-perspective');
    const oldFrames = flip.animations[0].keyframes as Array<{ transformOrigin?: string }>;
    expect(oldFrames[0].transformOrigin).toBe('195px 426px');
  });
});

describe('interaction tracker', () => {
  beforeEach(() => {
    installInteractionTracker();
    resetInteractionTracker();
    document.body.innerHTML = '';
  });

  test('snaps compact icon buttons to center, uses pointer coords for wide buttons, and rejects off-screen rects', () => {
    const compactBtn = document.createElement('button');
    compactBtn.getBoundingClientRect = () =>
      ({ left: 900, top: 10, width: 36, height: 36, right: 936, bottom: 46, x: 900, y: 10, toJSON: () => ({}) }) as DOMRect;
    document.body.appendChild(compactBtn);

    const pointerDownCompact = new Event('pointerdown', { bubbles: true }) as PointerEvent;
    Object.defineProperty(pointerDownCompact, 'clientX', { value: 905 });
    Object.defineProperty(pointerDownCompact, 'clientY', { value: 15 });
    compactBtn.dispatchEvent(pointerDownCompact);
    expect(getRecentTriggerPoint()).toEqual({ x: 918, y: 28 });

    resetInteractionTracker();

    const wideBtn = document.createElement('button');
    wideBtn.getBoundingClientRect = () =>
      ({ left: 20, top: 132, width: 250, height: 36, right: 270, bottom: 168, x: 20, y: 132, toJSON: () => ({}) }) as DOMRect;
    document.body.appendChild(wideBtn);

    const pointerDownWide = new Event('pointerdown', { bubbles: true }) as PointerEvent;
    Object.defineProperty(pointerDownWide, 'clientX', { value: 64 });
    Object.defineProperty(pointerDownWide, 'clientY', { value: 148 });
    wideBtn.dispatchEvent(pointerDownWide);
    expect(getRecentTriggerPoint()).toEqual({ x: 64, y: 148 });

    resetInteractionTracker();

    const offscreenBtn = document.createElement('button');
    offscreenBtn.getBoundingClientRect = () =>
      ({ left: -266, top: 132, width: 250, height: 36, right: -16, bottom: 168, x: -266, y: 132, toJSON: () => ({}) }) as DOMRect;
    document.body.appendChild(offscreenBtn);

    const clickOffscreen = new MouseEvent('click', { bubbles: true, detail: 0, clientX: 0, clientY: 0 });
    offscreenBtn.dispatchEvent(clickOffscreen);
    expect(getRecentTriggerPoint()).toBeNull();
  });
});

describe('transition engine', () => {
  const originalMatchMedia = window.matchMedia;
  const originalStartViewTransition = (document as any).startViewTransition;
  const originalAnimate = document.documentElement.animate;
  const originalGetComputedStyle = window.getComputedStyle;
  const originalVisualViewport = window.visualViewport;
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    clearEffectCache();
    resetEngineStateForTests();
    document.documentElement.className = '';
    window.matchMedia = ((query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList) as typeof window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    (document as any).startViewTransition = originalStartViewTransition;
    document.documentElement.animate = originalAnimate;
    window.getComputedStyle = originalGetComputedStyle;
    Object.defineProperty(window, 'visualViewport', { value: originalVisualViewport, configurable: true });
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true });
    resetEngineStateForTests();
  });

  test('falls back cleanly when document.startViewTransition is unavailable', async () => {
    (document as any).startViewTransition = undefined;
    expect(shouldAnimate(DEFAULT_CONFIG)).toBe(false);

    let applied = false;
    await runThemeTransition({
      config: DEFAULT_CONFIG,
      fromTheme: 'light',
      toTheme: 'dark',
      applyDomChange: () => {
        applied = true;
      },
    });

    expect(applied).toBe(true);
  });

  test('respects prefers-reduced-motion and disableOnMobile', () => {
    (document as any).startViewTransition = () => ({});

    window.matchMedia = ((query: string) =>
      ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
      }) as MediaQueryList) as typeof window.matchMedia;

    expect(shouldAnimate({ ...DEFAULT_CONFIG, respectReducedMotion: true })).toBe(false);
    expect(shouldAnimate({ ...DEFAULT_CONFIG, respectReducedMotion: false })).toBe(true);

    window.matchMedia = ((query: string) =>
      ({
        matches: query.includes('pointer: coarse'),
        media: query,
      }) as MediaQueryList) as typeof window.matchMedia;

    expect(shouldAnimate({ ...DEFAULT_CONFIG, disableOnMobile: true })).toBe(false);
    expect(shouldAnimate({ ...DEFAULT_CONFIG, disableOnMobile: false })).toBe(true);
  });

  test('runs startViewTransition + WAAPI animate and cleans up root classes', async () => {
    let applied = false;
    const animateCalls: Array<{ keyframes: unknown; options: KeyframeAnimationOptions }> = [];

    await loadEffect('circle');

    (document as any).startViewTransition = (cb: () => void) => {
      cb();
      return {
        ready: Promise.resolve(),
        finished: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: () => {},
      };
    };

    document.documentElement.animate = ((keyframes: Keyframe[] | PropertyIndexedKeyframes | null, options?: KeyframeAnimationOptions) => {
      animateCalls.push({ keyframes, options: options || {} });
      return {
        finished: Promise.resolve(),
        cancel: () => {},
      } as unknown as Animation;
    }) as typeof document.documentElement.animate;

    await runThemeTransition({
      config: DEFAULT_CONFIG,
      triggerPoint: { x: 100, y: 50 },
      fromTheme: 'light',
      toTheme: 'dark',
      applyDomChange: () => {
        applied = true;
      },
    });

    expect(applied).toBe(true);
    expect(animateCalls).toHaveLength(1);
    expect(animateCalls[0].options.pseudoElement).toBe('::view-transition-new(root)');
    expect(animateCalls[0].options.duration).toBe(480);
    expect(document.documentElement.classList.contains('tt-transitioning')).toBe(false);
    expect(document.documentElement.classList.contains('tt-reverse')).toBe(false);
    expect(document.querySelector('[data-tt-viewport-anchor]')).toBeNull();
  });

  test('accounts for mobile browser top and bottom bars via viewport anchor probe', async () => {
    Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 740, configurable: true });
    Object.defineProperty(window, 'visualViewport', {
      value: { width: 390, height: 740, offsetLeft: 0, offsetTop: 0 },
      configurable: true,
    });

    const animateCalls: Array<{ keyframes: any[]; options: KeyframeAnimationOptions }> = [];
    let anchorPresentDuringStart = false;

    await loadEffect('circle');
    await loadEffect('wipe');

    (document as any).startViewTransition = (cb: () => void) => {
      anchorPresentDuringStart = Boolean(document.querySelector('[data-tt-viewport-anchor]'));
      cb();
      return {
        ready: Promise.resolve(),
        finished: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: () => {},
      };
    };

    window.getComputedStyle = ((el: Element, pseudo?: string | null) => {
      if (pseudo === '::view-transition') {
        return { width: '390px', height: '844px', top: '0px', left: '0px', transform: 'none' } as CSSStyleDeclaration;
      }
      if (pseudo === '::view-transition-group(root)') {
        return { width: '390px', height: '844px', top: '0px', left: '0px', transform: 'none' } as CSSStyleDeclaration;
      }
      if (pseudo === '::view-transition-new(root)') {
        return { width: '390px', height: '844px', top: '0px', left: '0px', transform: 'none' } as CSSStyleDeclaration;
      }
      if (pseudo === '::view-transition-group(tt-viewport-anchor)') {
        return {
          width: '1px',
          height: '1px',
          top: '0px',
          left: '0px',
          transform: 'matrix(1, 0, 0, 1, 0, 56)',
        } as CSSStyleDeclaration;
      }
      return originalGetComputedStyle(el, pseudo);
    }) as typeof window.getComputedStyle;

    document.documentElement.animate = ((keyframes: Keyframe[] | PropertyIndexedKeyframes | null, options?: KeyframeAnimationOptions) => {
      animateCalls.push({ keyframes: keyframes as any[], options: options || {} });
      return {
        finished: Promise.resolve(),
        cancel: () => {},
      } as unknown as Animation;
    }) as typeof document.documentElement.animate;

    await runThemeTransition({
      config: DEFAULT_CONFIG,
      triggerPoint: { x: 350, y: 26 },
      fromTheme: 'light',
      toTheme: 'dark',
      applyDomChange: () => {},
    });

    expect(anchorPresentDuringStart).toBe(true);
    expect(animateCalls[0].keyframes).toEqual([
      { clipPath: 'circle(0px at 350px 82px)' },
      { clipPath: `circle(${maxCornerRadius(350, 82, 390, 844)}px at 350px 82px)` },
    ]);
    expect(document.querySelector('[data-tt-viewport-anchor]')).toBeNull();

    await runThemeTransition({
      config: { ...DEFAULT_CONFIG, effect: 'wipe', direction: 'bottom-to-top' },
      triggerPoint: null,
      fromTheme: 'light',
      toTheme: 'dark',
      applyDomChange: () => {},
    });

    expect(animateCalls[1].keyframes).toEqual([{ clipPath: 'inset(796px 0px 0px 0px)' }, { clipPath: 'inset(0px 0px 0px 0px)' }]);
    expect(document.querySelector('[data-tt-viewport-anchor]')).toBeNull();
  });

  test('install.ts does not import runtime named ColorScheme from ThemeMode', () => {
    const installSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/common/transitions/install.ts'), 'utf8');
    expect(installSrc).not.toMatch(/import\s*\{[^}]*\bColorScheme\b[^}]*\}\s*from\s*['"]flarum\/common\/components\/ThemeMode['"]/);
    expect(installSrc).not.toMatch(/\bColorScheme\.Auto\b/);
  });
});
