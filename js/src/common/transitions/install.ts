import app from 'flarum/common/app';
import Application from 'flarum/common/Application';
import { override } from 'flarum/common/extend';
import type { ColorScheme } from 'flarum/common/components/ThemeMode';
import { readConfig } from './config';
import { runThemeTransitionSyncOrAsync, shouldAnimate } from './engine';
import { getRecentTriggerPoint, hasRecentUserInteraction, installInteractionTracker } from './interactionTracker';
import { loadEffect } from './loader';

let installed = false;
let suppressDepth = 0;

function scheduleIdlePrefetch(task: () => void): void {
  if (typeof window === 'undefined') return;

  if ('requestIdleCallback' in window && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(task);
  } else {
    setTimeout(task, 300);
  }
}

export function installThemeTransitions(context: 'forum' | 'admin'): void {
  if (installed) {
    return;
  }

  installed = true;
  installInteractionTracker();

  override<{ initColorScheme: (...args: unknown[]) => void }, 'initColorScheme'>(
    Application.prototype as unknown as { initColorScheme: (...args: unknown[]) => void },
    'initColorScheme',
    function (original, ...args) {
      suppressDepth++;

      try {
        return original.apply(this, args);
      } finally {
        suppressDepth--;
      }
    }
  );

  override(
    Application.prototype,
    'setColorScheme',
    function (this: Application, original: (scheme: ColorScheme | string) => void, scheme: ColorScheme | string) {
      if (suppressDepth > 0) {
        return original(scheme);
      }

      const config = readConfig(context);

      if (context === 'admin' && !config.enableAdmin) {
        return original(scheme);
      }

      const fromTheme = document.documentElement.getAttribute('data-theme') || '';
      const toTheme = scheme === 'auto' ? this.getSystemColorSchemePreference() : String(scheme);

      if (!fromTheme || fromTheme === toTheme) {
        return original(scheme);
      }

      if (!hasRecentUserInteraction(2500)) {
        return original(scheme);
      }

      if (!shouldAnimate(config)) {
        return original(scheme);
      }

      runThemeTransitionSyncOrAsync({
        config,
        triggerPoint: getRecentTriggerPoint(2500),
        fromTheme,
        toTheme,
        applyDomChange: () => original(scheme),
      });
    }
  );

  app.beforeMount(() => {
    const config = readConfig(context);

    if (context === 'admin' && !config.enableAdmin) {
      return;
    }

    if (!shouldAnimate(config)) {
      return;
    }

    const activeEffect = config.effect;

    if (context === 'forum' && app.prefetch && typeof app.prefetch.add === 'function') {
      app.prefetch.add('huseyinfiliz-theme-transitions-effect', () => loadEffect(activeEffect));
    } else {
      scheduleIdlePrefetch(() => {
        loadEffect(activeEffect).catch(() => {});
      });
    }
  });
}
