import type { DirectionMode, TransitionContext, TransitionPlan } from '../types';

function px(value: number): string {
  return `${Math.round(value)}px`;
}

function quad(a: [number, number], b: [number, number], c: [number, number], d: [number, number]): string {
  return `polygon(${px(a[0])} ${px(a[1])}, ${px(b[0])} ${px(b[1])}, ${px(c[0])} ${px(c[1])}, ${px(d[0])} ${px(d[1])})`;
}

function diagonalPolygons(ctx: TransitionContext, direction: DirectionMode): [string, string] {
  const { width, height, visibleLeft, visibleTop, visibleWidth, visibleHeight } = ctx;
  const vx0 = visibleLeft;
  const vy0 = visibleTop;
  const vx1 = visibleLeft + visibleWidth;
  const vy1 = visibleTop + visibleHeight;

  const margin = Math.ceil(Math.max(vx0, vy0, width - vx1, height - vy1)) + 4;
  const span = Math.ceil(width + height) + 2 * margin + 8;

  switch (direction) {
    case 'right-to-left': {
      const b: [number, number] = [vx1 - span, height + margin];
      const d: [number, number] = [width + margin, vy1 - span];
      const c: [number, number] = [(b[0] + d[0]) / 2, (b[1] + d[1]) / 2];
      return [quad([vx1, vy1], [vx1, vy1], [vx1, vy1], [vx1, vy1]), quad([width + margin, height + margin], b, c, d)];
    }
    case 'top-to-bottom': {
      const b: [number, number] = [width + margin, vy0 + span];
      const d: [number, number] = [vx1 - span, -margin];
      const c: [number, number] = [(b[0] + d[0]) / 2, (b[1] + d[1]) / 2];
      return [quad([vx1, vy0], [vx1, vy0], [vx1, vy0], [vx1, vy0]), quad([width + margin, -margin], b, c, d)];
    }
    case 'bottom-to-top': {
      const b: [number, number] = [-margin, vy1 - span];
      const d: [number, number] = [vx0 + span, height + margin];
      const c: [number, number] = [(b[0] + d[0]) / 2, (b[1] + d[1]) / 2];
      return [quad([vx0, vy1], [vx0, vy1], [vx0, vy1], [vx0, vy1]), quad([-margin, height + margin], b, c, d)];
    }
    case 'left-to-right':
    default: {
      const b: [number, number] = [vx0 + span, -margin];
      const d: [number, number] = [-margin, vy0 + span];
      const c: [number, number] = [(b[0] + d[0]) / 2, (b[1] + d[1]) / 2];
      return [quad([vx0, vy0], [vx0, vy0], [vx0, vy0], [vx0, vy0]), quad([-margin, -margin], b, c, d)];
    }
  }
}

export default function runDiagonal(ctx: TransitionContext): TransitionPlan {
  const [collapsed, expanded] = diagonalPolygons(ctx, ctx.direction);

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
