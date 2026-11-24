import type { ReverseMode, TransitionConfig, TransitionPoint } from './types';
export interface RunTransitionOptions {
    config: TransitionConfig;
    triggerPoint?: TransitionPoint | null;
    fromTheme: string;
    toTheme: string;
    applyDomChange: () => void;
}
export declare function suppressCssTransitions(callback: () => void): void;
export declare function shouldAnimate(config: TransitionConfig): boolean;
export declare function computeReversed(mode: ReverseMode, fromDark: boolean, toDark: boolean, currentAlternateCounter: number): boolean;
export declare function runThemeTransitionSyncOrAsync(options: RunTransitionOptions): Promise<void>;
export declare function runThemeTransition(options: RunTransitionOptions): Promise<void>;
export declare function resetEngineStateForTests(): void;
