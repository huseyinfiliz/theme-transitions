import type {
  DirectionMode,
  EasingPreset,
  EffectId,
  EffectMeta,
  OriginMode,
  ReverseMode,
  SnapshotViewportBounds,
  TransitionConfig,
  TransitionPoint,
} from './types';

export const EFFECT_CATALOG: readonly EffectMeta[] = [
  {
    id: 'circle',
    icon: 'fas fa-circle-dot',
    category: 'radial',
    supportsOrigin: true,
    supportsReverse: true,
  },
  {
    id: 'circle-shrink',
    icon: 'fas fa-compress',
    category: 'radial',
    supportsOrigin: true,
    supportsReverse: true,
  },
  {
    id: 'circle-blur',
    icon: 'fas fa-sun',
    category: 'radial',
    supportsOrigin: true,
    supportsReverse: true,
    supportsBlur: true,
  },
  {
    id: 'wipe',
    icon: 'fas fa-window-maximize',
    category: 'geometric',
    supportsDirection: true,
    supportsReverse: true,
  },
  {
    id: 'diagonal',
    icon: 'fas fa-slash',
    category: 'geometric',
    supportsDirection: true,
    supportsReverse: true,
  },
  {
    id: 'split',
    icon: 'fas fa-table-columns',
    category: 'geometric',
    supportsDirection: true,
    supportsReverse: true,
  },
  {
    id: 'diamond',
    icon: 'fas fa-gem',
    category: 'geometric',
    supportsOrigin: true,
    supportsReverse: true,
  },
  {
    id: 'iris',
    icon: 'fas fa-camera',
    category: 'geometric',
    supportsOrigin: true,
    supportsReverse: true,
  },
  {
    id: 'blinds',
    icon: 'fas fa-bars',
    category: 'geometric',
    supportsDirection: true,
    supportsReverse: true,
    supportsBlinds: true,
  },
  {
    id: 'fade',
    icon: 'fas fa-adjust',
    category: 'cinematic',
    supportsReverse: true,
  },
  {
    id: 'blur',
    icon: 'fas fa-water',
    category: 'cinematic',
    supportsReverse: true,
    supportsBlur: true,
  },
  {
    id: 'zoom',
    icon: 'fas fa-magnifying-glass-plus',
    category: 'cinematic',
    supportsOrigin: true,
    supportsReverse: true,
  },
  {
    id: 'slide',
    icon: 'fas fa-arrows-left-right',
    category: 'cinematic',
    supportsDirection: true,
    supportsReverse: true,
  },
  {
    id: 'flip',
    icon: 'fas fa-rotate',
    category: 'cinematic',
    supportsDirection: true,
    supportsReverse: true,
  },
];

export const EFFECT_IDS: readonly EffectId[] = EFFECT_CATALOG.map((item) => item.id);

export const EASING_PRESETS: Record<Exclude<EasingPreset, 'custom'>, string> = {
  telegram: 'cubic-bezier(.33, .35, .28, 1)',
  smooth: 'cubic-bezier(.4, 0, .2, 1)',
  'ease-out': 'cubic-bezier(.16, 1, .3, 1)',
  'ease-in-out': 'cubic-bezier(.65, 0, .35, 1)',
  spring: 'cubic-bezier(.34, 1.25, .64, 1)',
  linear: 'linear',
};

export const ORIGIN_MODES: readonly OriginMode[] = ['trigger', 'center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];

export const DIRECTION_MODES: readonly DirectionMode[] = ['left-to-right', 'right-to-left', 'top-to-bottom', 'bottom-to-top'];

export const REVERSE_MODES: readonly ReverseMode[] = ['none', 'on-light', 'on-dark', 'alternate'];

export const DEFAULT_CONFIG: TransitionConfig = {
  enabled: true,
  effect: 'circle',
  duration: 480,
  easing: 'telegram',
  customEasing: EASING_PRESETS.telegram,
  origin: 'trigger',
  direction: 'left-to-right',
  reverseMode: 'none',
  blindsCount: 8,
  blurAmount: 12,
  enableAdmin: true,
  disableOnMobile: false,
  respectReducedMotion: true,
};

const VALID_TIMING_KEYWORDS = new Set(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out']);
const CUBIC_BEZIER_RE =
  /^cubic-bezier\(\s*([+-]?(?:\d+\.?\d*|\.\d+))\s*,\s*([+-]?(?:\d+\.?\d*|\.\d+))\s*,\s*([+-]?(?:\d+\.?\d*|\.\d+))\s*,\s*([+-]?(?:\d+\.?\d*|\.\d+))\s*\)$/i;

export function isEffectId(value: unknown): value is EffectId {
  return typeof value === 'string' && (EFFECT_IDS as readonly string[]).includes(value);
}

export function isEasingPreset(value: unknown): value is EasingPreset {
  return value === 'custom' || (typeof value === 'string' && value in EASING_PRESETS);
}

export function isOriginMode(value: unknown): value is OriginMode {
  return typeof value === 'string' && (ORIGIN_MODES as readonly string[]).includes(value);
}

export function isDirectionMode(value: unknown): value is DirectionMode {
  return typeof value === 'string' && (DIRECTION_MODES as readonly string[]).includes(value);
}

export function isReverseMode(value: unknown): value is ReverseMode {
  return typeof value === 'string' && (REVERSE_MODES as readonly string[]).includes(value);
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;

  if (!Number.isFinite(num)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(num)));
}

export function isValidCustomEasing(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const trimmed = value.trim();
  if (!trimmed) return false;

  if (VALID_TIMING_KEYWORDS.has(trimmed.toLowerCase())) {
    return true;
  }

  const match = CUBIC_BEZIER_RE.exec(trimmed);
  if (!match) return false;

  const x1 = Number(match[1]);
  const y1 = Number(match[2]);
  const x2 = Number(match[3]);
  const y2 = Number(match[4]);

  return Number.isFinite(x1) && Number.isFinite(y1) && Number.isFinite(x2) && Number.isFinite(y2) && x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1;
}

export function resolveEasing(preset: string, customEasing: string): string {
  if (preset === 'custom') {
    return isValidCustomEasing(customEasing) ? customEasing.trim() : EASING_PRESETS.telegram;
  }

  if (preset in EASING_PRESETS) {
    return EASING_PRESETS[preset as Exclude<EasingPreset, 'custom'>];
  }

  return EASING_PRESETS.telegram;
}

export function parseTransformTranslation(transform: string | null | undefined): TransitionPoint {
  if (!transform || transform === 'none') {
    return { x: 0, y: 0 };
  }

  const trimmed = transform.trim();

  if (trimmed.startsWith('matrix3d(') && trimmed.endsWith(')')) {
    const parts = trimmed
      .slice(9, -1)
      .split(',')
      .map((part) => Number(part.trim()));
    if (parts.length === 16 && Number.isFinite(parts[12]) && Number.isFinite(parts[13])) {
      return { x: parts[12], y: parts[13] };
    }
    return { x: 0, y: 0 };
  }

  if (trimmed.startsWith('matrix(') && trimmed.endsWith(')')) {
    const parts = trimmed
      .slice(7, -1)
      .split(',')
      .map((part) => Number(part.trim()));
    if (parts.length === 6 && Number.isFinite(parts[4]) && Number.isFinite(parts[5])) {
      return { x: parts[4], y: parts[5] };
    }
    return { x: 0, y: 0 };
  }

  return { x: 0, y: 0 };
}

export function resolveOriginPoint(origin: OriginMode, bounds: SnapshotViewportBounds, triggerPoint: TransitionPoint | null): TransitionPoint {
  const { width, height, visibleLeft, visibleTop, visibleWidth, visibleHeight, offsetX, offsetY } = bounds;
  const visibleCenterX = visibleLeft + visibleWidth / 2;
  const visibleCenterY = visibleTop + visibleHeight / 2;

  switch (origin) {
    case 'top-left':
      return { x: visibleLeft, y: visibleTop };
    case 'top-right':
      return { x: visibleLeft + visibleWidth, y: visibleTop };
    case 'bottom-left':
      return { x: visibleLeft, y: visibleTop + visibleHeight };
    case 'bottom-right':
      return { x: visibleLeft + visibleWidth, y: visibleTop + visibleHeight };
    case 'center':
      return { x: visibleCenterX, y: visibleCenterY };
    case 'trigger':
    default:
      if (triggerPoint && Number.isFinite(triggerPoint.x) && Number.isFinite(triggerPoint.y)) {
        return {
          x: Math.min(width, Math.max(0, triggerPoint.x + offsetX)),
          y: Math.min(height, Math.max(0, triggerPoint.y + offsetY)),
        };
      }

      return { x: visibleCenterX, y: visibleCenterY };
  }
}

export function maxCornerRadius(x: number, y: number, width: number, height: number): number {
  return Math.ceil(Math.hypot(Math.max(x, width - x), Math.max(y, height - y))) + 1;
}

export function isDarkTheme(theme: string): boolean {
  return theme.startsWith('dark');
}

export function getEffectMeta(id: EffectId): EffectMeta {
  return EFFECT_CATALOG.find((item) => item.id === id) ?? EFFECT_CATALOG[0];
}
