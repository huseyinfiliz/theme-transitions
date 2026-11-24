import { clampInt } from '../catalog';
import type { TransitionContext, TransitionPlan } from '../types';

export default function runBlur(ctx: TransitionContext): TransitionPlan {
  const blur = clampInt(ctx.blurAmount, 2, 32, 12);
  const softBlur = Math.max(1, Math.round(blur * 0.5));

  if (ctx.reversed) {
    return {
      reverseStack: true,
      animations: [
        {
          pseudoElement: '::view-transition-old(root)',
          keyframes: [
            { opacity: 1, filter: 'blur(0px)' },
            { opacity: 0, filter: `blur(${blur}px)` },
          ],
        },
        {
          pseudoElement: '::view-transition-new(root)',
          keyframes: [{ filter: `blur(${softBlur}px)` }, { filter: 'blur(0px)' }],
        },
      ],
    };
  }

  return {
    animations: [
      {
        pseudoElement: '::view-transition-new(root)',
        keyframes: [
          { opacity: 0, filter: `blur(${blur}px)` },
          { opacity: 1, filter: 'blur(0px)' },
        ],
      },
      {
        pseudoElement: '::view-transition-old(root)',
        keyframes: [{ filter: 'blur(0px)' }, { filter: `blur(${softBlur}px)` }],
      },
    ],
  };
}
