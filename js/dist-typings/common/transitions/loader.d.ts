import type { EffectId, TransitionEffectFn } from './types';
export declare function getCachedEffect(id: EffectId): TransitionEffectFn | undefined;
export declare function loadEffect(id: EffectId): Promise<TransitionEffectFn>;
export declare function clearEffectCache(): void;
