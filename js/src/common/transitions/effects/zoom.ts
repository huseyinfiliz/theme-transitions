import type { TransitionContext, TransitionPlan } from '../types';

export default function runZoom(ctx: TransitionContext): TransitionPlan {
  const transformOrigin = `${ctx.x}px ${ctx.y}px`;

  if (ctx.reversed) {
    return {
      reverseStack: true,
      animations: [
        {
          pseudoElement: '::view-transition-old(root)',
          keyframes: [
            { transformOrigin, transform: 'scale(1)', opacity: 1 },
            { transformOrigin, transform: 'scale(1.06)', opacity: 0 },
          ],
        },
      ],
    };
  }

  return {
    animations: [
      {
        pseudoElement: '::view-transition-new(root)',
        keyframes: [
          { transformOrigin, transform: 'scale(0.94)', opacity: 0 },
          { transformOrigin, transform: 'scale(1)', opacity: 1 },
        ],
      },
    ],
  };
}
