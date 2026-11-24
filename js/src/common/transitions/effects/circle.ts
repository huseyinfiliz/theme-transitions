import { maxCornerRadius } from '../catalog';
import type { TransitionContext, TransitionPlan } from '../types';

export default function runCircle(ctx: TransitionContext): TransitionPlan {
  const radius = maxCornerRadius(ctx.x, ctx.y, ctx.width, ctx.height);
  const collapsed = `circle(0px at ${ctx.x}px ${ctx.y}px)`;
  const expanded = `circle(${radius}px at ${ctx.x}px ${ctx.y}px)`;

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
