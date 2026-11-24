import type { DirectionMode, TransitionContext, TransitionPlan } from '../types';

function collapsedInset(ctx: TransitionContext, direction: DirectionMode): string {
  const { width, height, visibleLeft, visibleTop, visibleWidth, visibleHeight } = ctx;

  switch (direction) {
    case 'right-to-left': {
      const left = Math.round(Math.min(width, visibleLeft + visibleWidth));
      return `inset(0px 0px 0px ${left}px)`;
    }
    case 'top-to-bottom': {
      const bottom = Math.round(Math.max(0, height - visibleTop));
      return `inset(0px 0px ${bottom}px 0px)`;
    }
    case 'bottom-to-top': {
      const top = Math.round(Math.min(height, visibleTop + visibleHeight));
      return `inset(${top}px 0px 0px 0px)`;
    }
    case 'left-to-right':
    default: {
      const right = Math.round(Math.max(0, width - visibleLeft));
      return `inset(0px ${right}px 0px 0px)`;
    }
  }
}

export default function runWipe(ctx: TransitionContext): TransitionPlan {
  const full = 'inset(0px 0px 0px 0px)';
  const hidden = collapsedInset(ctx, ctx.direction);

  if (ctx.reversed) {
    return {
      reverseStack: true,
      animations: [
        {
          pseudoElement: '::view-transition-old(root)',
          keyframes: [{ clipPath: full }, { clipPath: hidden }],
        },
      ],
    };
  }

  return {
    animations: [
      {
        pseudoElement: '::view-transition-new(root)',
        keyframes: [{ clipPath: hidden }, { clipPath: full }],
      },
    ],
  };
}
