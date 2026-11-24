import { clampInt } from '../catalog';
import type { TransitionContext, TransitionPlan } from '../types';

function px(value: number): string {
  return `${Math.round(value * 10) / 10}px`;
}

function buildBlindsPolygons(ctx: TransitionContext, count: number): [string, string] {
  const { width, height, visibleLeft, visibleTop, visibleWidth, visibleHeight, direction } = ctx;
  const closedPoints: string[] = [];
  const openPoints: string[] = [];
  const isVerticalSlats = direction === 'left-to-right' || direction === 'right-to-left';
  const fromEnd = direction === 'right-to-left' || direction === 'bottom-to-top';

  const spanStart = isVerticalSlats ? visibleLeft : visibleTop;
  const spanSize = isVerticalSlats ? visibleWidth : visibleHeight;
  const fullSize = isVerticalSlats ? width : height;
  const step = spanSize / count;

  for (let i = 0; i < count; i++) {
    const bandStart = spanStart + i * step;
    const bandEnd = spanStart + (i + 1) * step;
    const anchor = fromEnd ? bandEnd : bandStart;
    const openStart = i === 0 ? 0 : bandStart;
    const openEnd = i === count - 1 ? fullSize : Math.min(fullSize, bandEnd + 0.5);

    if (isVerticalSlats) {
      closedPoints.push(`${px(anchor)} 0px`, `${px(anchor)} ${px(height)}`, `${px(anchor)} ${px(height)}`, `${px(anchor)} 0px`);
      openPoints.push(`${px(openStart)} 0px`, `${px(openStart)} ${px(height)}`, `${px(openEnd)} ${px(height)}`, `${px(openEnd)} 0px`);
    } else {
      closedPoints.push(`0px ${px(anchor)}`, `${px(width)} ${px(anchor)}`, `${px(width)} ${px(anchor)}`, `0px ${px(anchor)}`);
      openPoints.push(`0px ${px(openStart)}`, `${px(width)} ${px(openStart)}`, `${px(width)} ${px(openEnd)}`, `0px ${px(openEnd)}`);
    }
  }

  return [`polygon(${closedPoints.join(', ')})`, `polygon(${openPoints.join(', ')})`];
}

export default function runBlinds(ctx: TransitionContext): TransitionPlan {
  const count = clampInt(ctx.blindsCount, 3, 24, 8);
  const [closed, open] = buildBlindsPolygons(ctx, count);

  if (ctx.reversed) {
    return {
      reverseStack: true,
      animations: [
        {
          pseudoElement: '::view-transition-old(root)',
          keyframes: [{ clipPath: open }, { clipPath: closed }],
        },
      ],
    };
  }

  return {
    animations: [
      {
        pseudoElement: '::view-transition-new(root)',
        keyframes: [{ clipPath: closed }, { clipPath: open }],
      },
    ],
  };
}
