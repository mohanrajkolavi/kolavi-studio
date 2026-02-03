"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const SheetContext = React.createContext<{
  open: boolean;
  onCloseAnimationEnd: () => void;
}>({ open: false, onCloseAnimationEnd: () => {} });

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const CLOSE_ANIMATION_MS = 300;

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  const [mounted, setMounted] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(open);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (open) setIsVisible(true);
  }, [open]);

  const onCloseAnimationEnd = React.useCallback(() => {
    setIsVisible(false);
  }, []);

  React.useEffect(() => {
    if (!open && isVisible) {
      const fallback = setTimeout(
        () => setIsVisible(false),
        CLOSE_ANIMATION_MS
      );
      return () => clearTimeout(fallback);
    }
  }, [open, isVisible]);

  if (!mounted || typeof document === "undefined") return null;
  if (!isVisible) return null;

  return createPortal(
    <SheetContext.Provider value={{ open, onCloseAnimationEnd }}>
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      {children}
    </SheetContext.Provider>,
    document.body
  );
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right" | "top" | "bottom";
}

export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = "right", className, children, ...props }, ref) => {
    const { open, onCloseAnimationEnd } = React.useContext(SheetContext);
    const sideClasses = {
      left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r",
      right: "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l",
      top: "inset-x-0 top-0 w-full border-b",
      bottom: "inset-x-0 bottom-0 w-full border-t",
    };

    const handleAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
      if (!open && e.target === e.currentTarget) {
        onCloseAnimationEnd();
      }
      props.onAnimationEnd?.(e);
    };

    return (
      <div
        ref={ref}
        data-state={open ? "open" : "closed"}
        className={cn(
          "fixed z-[101] gap-4 border-border bg-background p-6 shadow-xl transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
          sideClasses[side],
          className
        )}
        {...props}
        onAnimationEnd={handleAnimationEnd}
      >
        {children}
      </div>
    );
  }
);
SheetContent.displayName = "SheetContent";

export function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

export function SheetTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    /* eslint-disable-next-line jsx-a11y/heading-has-content -- SheetTitle is a wrapper; content comes from parent */
    <h2
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  );
}
