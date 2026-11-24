import type { TransitionPoint } from './types';

let installed = false;
let lastPoint: TransitionPoint | null = null;
let lastInteractionAt = 0;

const COMPACT_TRIGGER_MAX_PX = 72;

function isOnScreenRect(rect: DOMRect | DOMRectReadOnly): boolean {
  const vw =
    (typeof window !== 'undefined' && window.innerWidth) || (typeof document !== 'undefined' && document.documentElement?.clientWidth) || Infinity;
  const vh =
    (typeof window !== 'undefined' && window.innerHeight) || (typeof document !== 'undefined' && document.documentElement?.clientHeight) || Infinity;

  return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.bottom > 0 && rect.left < vw && rect.top < vh;
}

function centerOfVisibleElement(el: Element | null): TransitionPoint | null {
  if (!el || typeof el.getBoundingClientRect !== 'function') {
    return null;
  }

  const rect = el.getBoundingClientRect();
  if (!isOnScreenRect(rect)) {
    return null;
  }

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function findTriggerElement(target: EventTarget | null): Element | null {
  if (!target || typeof (target as Element).closest !== 'function') {
    return null;
  }

  return (target as Element).closest('button, [role="button"], a, label, input, .ThemeMode');
}

function resolvePointerPoint(target: EventTarget | null, clientX: number, clientY: number): TransitionPoint | null {
  const trigger = findTriggerElement(target);

  if (trigger && typeof trigger.getBoundingClientRect === 'function') {
    const rect = trigger.getBoundingClientRect();

    if (isOnScreenRect(rect) && rect.width <= COMPACT_TRIGGER_MAX_PX && rect.height <= COMPACT_TRIGGER_MAX_PX) {
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
  }

  if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
    return { x: clientX, y: clientY };
  }

  return centerOfVisibleElement(trigger);
}

function recordPoint(point: TransitionPoint | null): void {
  lastInteractionAt = Date.now();
  if (point) {
    lastPoint = point;
  }
}

function handlePointerDown(event: PointerEvent): void {
  recordPoint(resolvePointerPoint(event.target, event.clientX, event.clientY));
}

function handleTouchStart(event: TouchEvent): void {
  const touch = event.touches?.[0];
  if (!touch) return;

  recordPoint(resolvePointerPoint(event.target, touch.clientX, touch.clientY));
}

function handleClick(event: MouseEvent): void {
  const isKeyboardClick = event.detail === 0 || (event.clientX === 0 && event.clientY === 0);

  if (!isKeyboardClick && Date.now() - lastInteractionAt < 100 && lastPoint) {
    return;
  }

  if (isKeyboardClick) {
    const trigger = findTriggerElement(event.target) ?? (event.target instanceof Element ? event.target : null);
    recordPoint(centerOfVisibleElement(trigger));
    return;
  }

  recordPoint(resolvePointerPoint(event.target, event.clientX, event.clientY));
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  const active = typeof document !== 'undefined' ? document.activeElement : null;
  const trigger = findTriggerElement(active) ?? active;
  recordPoint(centerOfVisibleElement(trigger));
}

export function installInteractionTracker(): void {
  if (installed || typeof document === 'undefined') {
    return;
  }

  installed = true;

  document.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: true });
  document.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
  document.addEventListener('click', handleClick, { capture: true, passive: true });
  document.addEventListener('keydown', handleKeyDown, { capture: true, passive: true });
}

export function hasRecentUserInteraction(maxAgeMs = 2500): boolean {
  if (lastInteractionAt === 0) {
    return false;
  }

  return Date.now() - lastInteractionAt <= maxAgeMs;
}

export function getRecentTriggerPoint(maxAgeMs = 2500): TransitionPoint | null {
  if (!hasRecentUserInteraction(maxAgeMs)) {
    return null;
  }

  return lastPoint;
}

export function resetInteractionTracker(): void {
  lastPoint = null;
  lastInteractionAt = 0;
}
