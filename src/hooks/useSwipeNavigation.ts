"use client";

import { useEffect, useRef } from "react";

type SwipeHandler = () => void;

interface SwipeNavigationOptions {
  onSwipeLeft?: SwipeHandler;
  onSwipeRight?: SwipeHandler;
  threshold?: number;
  verticalTolerance?: number;
  wheelThreshold?: number;
  resetDelayMs?: number;
  ignoreInputs?: boolean;
}

/**
 * Attaches touch/pointer/trackpad swipe listeners to a DOM node.
 * Returns the ref to place on the element that should react to swipes.
 */
export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
  verticalTolerance = 60,
  wheelThreshold = 120,
  resetDelayMs = 400,
  ignoreInputs = true,
}: SwipeNavigationOptions) {
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = targetRef.current;
    if (!node || (!onSwipeLeft && !onSwipeRight)) return;

    let startX = 0;
    let startY = 0;
    let active = false;
    let wheelX = 0;
    let wheelTimeout: number | null = null;

    const isTextInput = (el: EventTarget | null) => {
      if (!ignoreInputs) return false;
      return (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.getAttribute("contenteditable") === "true")
      );
    };

    const resetWheel = () => {
      wheelX = 0;
      if (wheelTimeout) {
        window.clearTimeout(wheelTimeout);
        wheelTimeout = null;
      }
    };

    const start = (x: number, y: number, target: EventTarget | null) => {
      if (isTextInput(target)) return;
      startX = x;
      startY = y;
      active = true;
    };

    const end = (x: number, y: number) => {
      if (!active) return;
      const deltaX = startX - x;
      const deltaY = Math.abs(startY - y);

      if (deltaY > verticalTolerance) {
        active = false;
        return;
      }

      if (deltaX > threshold && onSwipeLeft) {
        onSwipeLeft();
      } else if (-deltaX > threshold && onSwipeRight) {
        onSwipeRight();
      }

      active = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) start(touch.clientX, touch.clientY, e.target);
    };

    const onTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (touch) end(touch.clientX, touch.clientY);
    };

    const onTouchCancel = () => {
      active = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      start(e.clientX, e.clientY, e.target);
    };

    const onPointerUp = (e: PointerEvent) => {
      end(e.clientX, e.clientY);
    };

    const onWheel = (e: WheelEvent) => {
      if (isTextInput(e.target) || e.ctrlKey) return;

      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      if (absY > absX * 1.3) return;

      wheelX += e.deltaX;

      if (onSwipeLeft && wheelX < -wheelThreshold) {
        resetWheel();
        onSwipeLeft();
        return;
      }

      if (onSwipeRight && wheelX > wheelThreshold) {
        resetWheel();
        onSwipeRight();
        return;
      }

      if (wheelTimeout) {
        window.clearTimeout(wheelTimeout);
      }
      wheelTimeout = window.setTimeout(resetWheel, resetDelayMs);
    };

    node.addEventListener("touchstart", onTouchStart, { passive: true });
    node.addEventListener("touchend", onTouchEnd, { passive: true });
    node.addEventListener("touchcancel", onTouchCancel, { passive: true });
    node.addEventListener("pointerdown", onPointerDown);
    node.addEventListener("pointerup", onPointerUp);
    node.addEventListener("wheel", onWheel, { passive: true });

    return () => {
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchend", onTouchEnd);
      node.removeEventListener("touchcancel", onTouchCancel);
      node.removeEventListener("pointerdown", onPointerDown);
      node.removeEventListener("pointerup", onPointerUp);
      node.removeEventListener("wheel", onWheel);
      resetWheel();
    };
  }, [ignoreInputs, onSwipeLeft, onSwipeRight, resetDelayMs, threshold, verticalTolerance, wheelThreshold]);

  return targetRef;
}
