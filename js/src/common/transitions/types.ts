export type EffectId =
  | 'circle'
  | 'circle-shrink'
  | 'circle-blur'
  | 'wipe'
  | 'diagonal'
  | 'split'
  | 'diamond'
  | 'iris'
  | 'blinds'
  | 'fade'
  | 'blur'
  | 'zoom'
  | 'slide'
  | 'flip';

export type EasingPreset = 'telegram' | 'smooth' | 'ease-out' | 'ease-in-out' | 'spring' | 'linear' | 'custom';

export type OriginMode = 'trigger' | 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type DirectionMode = 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';

export type ReverseMode = 'none' | 'on-light' | 'on-dark' | 'alternate';

export interface TransitionConfig {
  enabled: boolean;
  effect: EffectId;
  duration: number;
  easing: EasingPreset;
  customEasing: string;
  origin: OriginMode;
  direction: DirectionMode;
  reverseMode: ReverseMode;
  blindsCount: number;
  blurAmount: number;
  enableAdmin: boolean;
  disableOnMobile: boolean;
  respectReducedMotion: boolean;
}

export interface TransitionPoint {
  x: number;
  y: number;
}

export interface SnapshotViewportBounds {
  width: number;
  height: number;
  visibleLeft: number;
  visibleTop: number;
  visibleWidth: number;
  visibleHeight: number;
  offsetX: number;
  offsetY: number;
}

export interface TransitionContext {
  width: number;
  height: number;
  visibleLeft: number;
  visibleTop: number;
  visibleWidth: number;
  visibleHeight: number;
  x: number;
  y: number;
  duration: number;
  easing: string;
  direction: DirectionMode;
  reversed: boolean;
  fromDark: boolean;
  toDark: boolean;
  blindsCount: number;
  blurAmount: number;
}

export interface PseudoAnimationSpec {
  pseudoElement: '::view-transition-new(root)' | '::view-transition-old(root)';
  keyframes: Keyframe[] | PropertyIndexedKeyframes;
  options?: Partial<KeyframeAnimationOptions>;
}

export interface TransitionPlan {
  reverseStack?: boolean;
  rootClasses?: string[];
  animations: PseudoAnimationSpec[];
}

export type TransitionEffectFn = (ctx: TransitionContext) => TransitionPlan;

export interface EffectMeta {
  id: EffectId;
  icon: string;
  category: 'radial' | 'geometric' | 'cinematic';
  supportsOrigin?: boolean;
  supportsDirection?: boolean;
  supportsReverse?: boolean;
  supportsBlinds?: boolean;
  supportsBlur?: boolean;
}
