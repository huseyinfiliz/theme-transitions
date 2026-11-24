import app from 'flarum/common/app';
import { clampInt, DEFAULT_CONFIG, isDirectionMode, isEasingPreset, isEffectId, isOriginMode, isReverseMode } from './catalog';
import type { TransitionConfig } from './types';

export const SETTINGS_PREFIX = 'huseyinfiliz-theme-transitions.';

export function parseBooleanSetting(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
      return true;
    }
    if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off' || normalized === '') {
      return false;
    }
  }

  return fallback;
}

export function parseConfigFromSettingsMap(map: Record<string, unknown> | null | undefined): TransitionConfig {
  const source = map ?? {};

  const rawEffect = source[`${SETTINGS_PREFIX}effect`];
  const rawEasing = source[`${SETTINGS_PREFIX}easing`];
  const rawCustomEasing = source[`${SETTINGS_PREFIX}custom_easing`];
  const rawOrigin = source[`${SETTINGS_PREFIX}origin`];
  const rawDirection = source[`${SETTINGS_PREFIX}direction`];
  const rawReverseMode = source[`${SETTINGS_PREFIX}reverse_mode`];

  return {
    enabled: parseBooleanSetting(source[`${SETTINGS_PREFIX}enabled`], DEFAULT_CONFIG.enabled),
    effect: isEffectId(rawEffect) ? rawEffect : DEFAULT_CONFIG.effect,
    duration: clampInt(source[`${SETTINGS_PREFIX}duration`], 100, 2000, DEFAULT_CONFIG.duration),
    easing: isEasingPreset(rawEasing) ? rawEasing : DEFAULT_CONFIG.easing,
    customEasing: typeof rawCustomEasing === 'string' && rawCustomEasing.trim() !== '' ? rawCustomEasing.trim() : DEFAULT_CONFIG.customEasing,
    origin: isOriginMode(rawOrigin) ? rawOrigin : DEFAULT_CONFIG.origin,
    direction: isDirectionMode(rawDirection) ? rawDirection : DEFAULT_CONFIG.direction,
    reverseMode: isReverseMode(rawReverseMode) ? rawReverseMode : DEFAULT_CONFIG.reverseMode,
    blindsCount: clampInt(source[`${SETTINGS_PREFIX}blinds_count`], 3, 24, DEFAULT_CONFIG.blindsCount),
    blurAmount: clampInt(source[`${SETTINGS_PREFIX}blur_amount`], 2, 32, DEFAULT_CONFIG.blurAmount),
    enableAdmin: parseBooleanSetting(source[`${SETTINGS_PREFIX}enable_admin`], DEFAULT_CONFIG.enableAdmin),
    disableOnMobile: parseBooleanSetting(source[`${SETTINGS_PREFIX}disable_on_mobile`], DEFAULT_CONFIG.disableOnMobile),
    respectReducedMotion: parseBooleanSetting(source[`${SETTINGS_PREFIX}respect_reduced_motion`], DEFAULT_CONFIG.respectReducedMotion),
  };
}

export function readConfig(context: 'forum' | 'admin'): TransitionConfig {
  if (context === 'admin') {
    const settings = (app.data as { settings?: Record<string, unknown> } | undefined)?.settings;
    return parseConfigFromSettingsMap(settings);
  }

  const forum = (app as { forum?: { attribute?: <T = unknown>(key: string) => T } }).forum;

  if (!forum || typeof forum.attribute !== 'function') {
    return { ...DEFAULT_CONFIG };
  }

  const rawEffect = forum.attribute('themeTransitionsEffect');
  const rawEasing = forum.attribute('themeTransitionsEasing');
  const rawCustomEasing = forum.attribute('themeTransitionsCustomEasing');
  const rawOrigin = forum.attribute('themeTransitionsOrigin');
  const rawDirection = forum.attribute('themeTransitionsDirection');
  const rawReverseMode = forum.attribute('themeTransitionsReverseMode');

  return {
    enabled: parseBooleanSetting(forum.attribute('themeTransitionsEnabled'), DEFAULT_CONFIG.enabled),
    effect: isEffectId(rawEffect) ? rawEffect : DEFAULT_CONFIG.effect,
    duration: clampInt(forum.attribute('themeTransitionsDuration'), 100, 2000, DEFAULT_CONFIG.duration),
    easing: isEasingPreset(rawEasing) ? rawEasing : DEFAULT_CONFIG.easing,
    customEasing: typeof rawCustomEasing === 'string' && rawCustomEasing.trim() !== '' ? rawCustomEasing.trim() : DEFAULT_CONFIG.customEasing,
    origin: isOriginMode(rawOrigin) ? rawOrigin : DEFAULT_CONFIG.origin,
    direction: isDirectionMode(rawDirection) ? rawDirection : DEFAULT_CONFIG.direction,
    reverseMode: isReverseMode(rawReverseMode) ? rawReverseMode : DEFAULT_CONFIG.reverseMode,
    blindsCount: clampInt(forum.attribute('themeTransitionsBlindsCount'), 3, 24, DEFAULT_CONFIG.blindsCount),
    blurAmount: clampInt(forum.attribute('themeTransitionsBlurAmount'), 2, 32, DEFAULT_CONFIG.blurAmount),
    enableAdmin: parseBooleanSetting(forum.attribute('themeTransitionsEnableAdmin'), DEFAULT_CONFIG.enableAdmin),
    disableOnMobile: parseBooleanSetting(forum.attribute('themeTransitionsDisableOnMobile'), DEFAULT_CONFIG.disableOnMobile),
    respectReducedMotion: parseBooleanSetting(forum.attribute('themeTransitionsRespectReducedMotion'), DEFAULT_CONFIG.respectReducedMotion),
  };
}
