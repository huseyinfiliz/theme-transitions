import type { TransitionPoint } from './types';
export declare function installInteractionTracker(): void;
export declare function hasRecentUserInteraction(maxAgeMs?: number): boolean;
export declare function getRecentTriggerPoint(maxAgeMs?: number): TransitionPoint | null;
export declare function resetInteractionTracker(): void;
