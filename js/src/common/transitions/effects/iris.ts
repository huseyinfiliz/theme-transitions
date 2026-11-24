import { maxCornerRadius } from '../catalog';
import type { TransitionContext, TransitionPlan } from '../types';

function octagonPolygon(cx: number, cy: number, radius: number, angleOffset: number): string {
  const points: string[] = [];

  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + angleOffset;
    const px = Math.round((cx + radius * Math.cos(angle)) * 10) / 10;
    const py = Math.round((cy + radius * Math.sin(angle)) * 10) / 10;
    points.push(`${px}px ${py}px`);
  }

  return `polygon(${points.join(', ')})`;
}

export default function runIris(ctx: TransitionContext): TransitionPlan {
  const maxR = Math.ceil(maxCornerRadius(ctx.x, ctx.y, ctx.width, ctx.height) * 1.1) + 2;
  const twist = Math.PI / 8; // 22.5deg subtle aperture twist

  const collapsed = octagonPolygon(ctx.x, ctx.y, 0, -twist);
  const mid = octagonPolygon(ctx.x, ctx.y, maxR * 0.45, -twist * 0.5);
  const expanded = octagonPolygon(ctx.x, ctx.y, maxR, 0);

  if (ctx.reversed) {
    return {
      reverseStack: true,
      animations: [
        {
          pseudoElement: '::view-transition-old(root)',
          keyframes: [
            { clipPath: expanded, offset: 0 },
            { clipPath: mid, offset: 0.55 },
            { clipPath: collapsed, offset: 1 },
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
          { clipPath: collapsed, offset: 0 },
          { clipPath: mid, offset: 0.45 },
          { clipPath: expanded, offset: 1 },
        ],
      },
    ],
  };
}
