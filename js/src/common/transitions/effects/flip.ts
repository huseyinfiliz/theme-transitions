import type { TransitionContext, TransitionPlan } from '../types';

export default function runFlip(ctx: TransitionContext): TransitionPlan {
  const isVertical = ctx.direction === 'top-to-bottom' || ctx.direction === 'bottom-to-top';
  const axis = isVertical ? 'rotateX' : 'rotateY';
  const dirSign = ctx.direction === 'right-to-left' || ctx.direction === 'bottom-to-top' ? -1 : 1;
  const sign = dirSign * (ctx.reversed ? -1 : 1);
  const transformOrigin = `${Math.round(ctx.visibleLeft + ctx.visibleWidth / 2)}px ${Math.round(ctx.visibleTop + ctx.visibleHeight / 2)}px`;

  return {
    rootClasses: ['tt-perspective'],
    animations: [
      {
        pseudoElement: '::view-transition-old(root)',
        keyframes: [
          { transformOrigin, transform: `${axis}(0deg)`, opacity: 1, offset: 0 },
          { transformOrigin, transform: `${axis}(${sign * 90}deg)`, opacity: 0, offset: 0.5 },
          { transformOrigin, transform: `${axis}(${sign * 90}deg)`, opacity: 0, offset: 1 },
        ],
      },
      {
        pseudoElement: '::view-transition-new(root)',
        keyframes: [
          { transformOrigin, transform: `${axis}(${-sign * 90}deg)`, opacity: 0, offset: 0 },
          { transformOrigin, transform: `${axis}(${-sign * 90}deg)`, opacity: 0, offset: 0.5 },
          { transformOrigin, transform: `${axis}(0deg)`, opacity: 1, offset: 1 },
        ],
      },
    ],
  };
}
