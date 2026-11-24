import type { DirectionMode, TransitionContext, TransitionPlan } from '../types';

function effectiveDirection(direction: DirectionMode, reversed: boolean): DirectionMode {
  if (!reversed) return direction;

  switch (direction) {
    case 'left-to-right':
      return 'right-to-left';
    case 'right-to-left':
      return 'left-to-right';
    case 'top-to-bottom':
      return 'bottom-to-top';
    case 'bottom-to-top':
    default:
      return 'top-to-bottom';
  }
}

export default function runSlide(ctx: TransitionContext): TransitionPlan {
  const dir = effectiveDirection(ctx.direction, ctx.reversed);
  const isVertical = dir === 'top-to-bottom' || dir === 'bottom-to-top';
  const sign = dir === 'left-to-right' || dir === 'top-to-bottom' ? -1 : 1;
  const fn = isVertical ? 'translateY' : 'translateX';

  return {
    animations: [
      {
        pseudoElement: '::view-transition-new(root)',
        keyframes: [{ transform: `${fn}(${sign * 100}%)` }, { transform: `${fn}(0%)` }],
      },
      {
        pseudoElement: '::view-transition-old(root)',
        keyframes: [
          { transform: `${fn}(0%)`, opacity: 1 },
          { transform: `${fn}(${-sign * 25}%)`, opacity: 0.85 },
        ],
      },
    ],
  };
}
