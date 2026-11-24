import type { TransitionConfig } from './types';
export declare const SETTINGS_PREFIX = "huseyinfiliz-theme-transitions.";
export declare function parseBooleanSetting(value: unknown, fallback: boolean): boolean;
export declare function parseConfigFromSettingsMap(map: Record<string, unknown> | null | undefined): TransitionConfig;
export declare function readConfig(context: 'forum' | 'admin'): TransitionConfig;
