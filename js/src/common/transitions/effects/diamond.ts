import type { TransitionContext, TransitionPlan } from '../types';

export default function runDiamond(ctx: TransitionContext): TransitionPlan {
  const { x, y, width, height } = ctx;
  const dist = Math.ceil(Math.max(x, width - x) + Math.max(y, height - y)) + 2;

  const collapsed = `polygon(${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px)`;
  const expanded = `polygon(${x}px ${y - dist}px, ${x + dist}px ${y}px, ${x}px ${y + dist}px, ${x - dist}px ${y}px)`;

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
