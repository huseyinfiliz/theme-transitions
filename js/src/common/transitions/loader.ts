import type { EffectId, TransitionEffectFn } from './types';

type EffectModule = { default: TransitionEffectFn };

const effectCache = new Map<EffectId, TransitionEffectFn>();
const pendingLoads = new Map<EffectId, Promise<TransitionEffectFn>>();

const effectImporters: Record<EffectId, () => Promise<EffectModule>> = {
  circle: () => import('./effects/circle'),
  'circle-shrink': () => import('./effects/circleShrink'),
  'circle-blur': () => import('./effects/circleBlur'),
  wipe: () => import('./effects/wipe'),
  diagonal: () => import('./effects/diagonal'),
  split: () => import('./effects/split'),
  diamond: () => import('./effects/diamond'),
  iris: () => import('./effects/iris'),
  blinds: () => import('./effects/blinds'),
  fade: () => import('./effects/fade'),
  blur: () => import('./effects/blur'),
  zoom: () => import('./effects/zoom'),
  slide: () => import('./effects/slide'),
  flip: () => import('./effects/flip'),
};

export function getCachedEffect(id: EffectId): TransitionEffectFn | undefined {
  return effectCache.get(id);
}

export function loadEffect(id: EffectId): Promise<TransitionEffectFn> {
  const cached = effectCache.get(id);
  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = pendingLoads.get(id);
  if (pending) {
    return pending;
  }

  const importer = effectImporters[id] ?? effectImporters.circle;

  const promise = importer()
    .then((mod) => {
      const fn = mod.default;
      effectCache.set(id, fn);
      pendingLoads.delete(id);
      return fn;
    })
    .catch((err) => {
      pendingLoads.delete(id);
      throw err;
    });

  pendingLoads.set(id, promise);

  return promise;
}

export function clearEffectCache(): void {
  effectCache.clear();
  pendingLoads.clear();
}
