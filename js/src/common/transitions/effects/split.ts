import type { TransitionContext, TransitionPlan } from '../types';

export default function runSplit(ctx: TransitionContext): TransitionPlan {
  const { width, height, visibleLeft, visibleTop, visibleWidth, visibleHeight } = ctx;
  const isVerticalCurtain = ctx.direction === 'top-to-bottom' || ctx.direction === 'bottom-to-top';

  const midX = Math.round(visibleLeft + visibleWidth / 2);
  const midY = Math.round(visibleTop + visibleHeight / 2);

  const collapsed = isVerticalCurtain
    ? `inset(${midY}px 0px ${Math.max(0, Math.round(height) - midY)}px 0px)`
    : `inset(0px ${Math.max(0, Math.round(width) - midX)}px 0px ${midX}px)`;
  const expanded = 'inset(0px 0px 0px 0px)';

  if (ctx.reversed) {
    return {
      reverseStack: true,
      animations: [
        {
          pseudoElement: '::view-transition-old(root)',
          keyframes: [{ clipPath: expanded }, { clipPath: collapsed }],
        },
      ],
    };
  }

  return {
    animations: [
      {
        pseudoElement: '::view-transition-new(root)',
        keyframes: [{ clipPath: collapsed }, { clipPath: expanded }],
      },
    ],
  };
}
