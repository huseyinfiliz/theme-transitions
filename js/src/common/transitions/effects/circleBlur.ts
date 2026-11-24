import { clampInt, maxCornerRadius } from '../catalog';
import type { TransitionContext, TransitionPlan } from '../types';

export default function runCircleBlur(ctx: TransitionContext): TransitionPlan {
  const radius = maxCornerRadius(ctx.x, ctx.y, ctx.width, ctx.height);
  const blur = clampInt(ctx.blurAmount, 2, 32, 12);
  const collapsed = `circle(0px at ${ctx.x}px ${ctx.y}px)`;
  const expanded = `circle(${radius}px at ${ctx.x}px ${ctx.y}px)`;

  if (ctx.reversed) {
    return {
      reverseStack: true,
      animations: [
        {
          pseudoElement: '::view-transition-old(root)',
          keyframes: [
            { clipPath: expanded, filter: 'blur(0px)', opacity: 1 },
            { clipPath: collapsed, filter: `blur(${blur}px)`, opacity: 0.85 },
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
          { clipPath: collapsed, filter: `blur(${blur}px)`, opacity: 0.85 },
          { clipPath: expanded, filter: 'blur(0px)', opacity: 1 },
        ],
      },
    ],
  };
}
