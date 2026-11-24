import type { TransitionContext, TransitionPlan } from '../types';

export default function runFade(ctx: TransitionContext): TransitionPlan {
  if (ctx.reversed) {
    return {
      reverseStack: true,
      animations: [
        {
          pseudoElement: '::view-transition-old(root)',
          keyframes: [{ opacity: 1 }, { opacity: 0 }],
        },
      ],
    };
  }

  return {
    animations: [
      {
        pseudoElement: '::view-transition-new(root)',
        keyframes: [{ opacity: 0 }, { opacity: 1 }],
      },
    ],
  };
}
