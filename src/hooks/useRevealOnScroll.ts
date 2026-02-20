"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_THRESHOLD = 0.1;
const DEFAULT_ROOT_MARGIN = "80px";

/**
 * Reveal content when the element scrolls into view. Uses element state + useEffect
 * so the observer is attached after the node is mounted (avoids ref timing issues).
 */
export function useRevealOnScroll(options?: {
  threshold?: number;
  rootMargin?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [element, setElement] = useState<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
  const rootMargin = options?.rootMargin ?? DEFAULT_ROOT_MARGIN;

  const setRef = useCallback((node: HTMLElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
          observerRef.current = null;
        }
      },
      { threshold, rootMargin }
    );
    observerRef.current = observer;
    observer.observe(element);

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [element, threshold, rootMargin]);

  return [setRef, isVisible] as const;
}
