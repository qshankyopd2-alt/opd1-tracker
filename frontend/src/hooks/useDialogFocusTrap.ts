import { useEffect, useRef } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function dialogKeyIntent(key: string): "close" | "cycle" | "ignore" {
  if (key === "Escape") return "close";
  if (key === "Tab") return "cycle";
  return "ignore";
}

export function useDialogFocusTrap(onClose: () => void, active = true) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!active) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    dialogRef.current?.focus();
    return () => previousFocusRef.current?.focus();
  }, [active]);
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!active) return;
    const intent = dialogKeyIntent(event.key);
    if (intent === "close") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (intent !== "cycle" || !dialogRef.current) return;
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      .filter((element) => element.offsetWidth > 0 || element.offsetHeight > 0);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      last.focus(); event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === last) {
      first.focus(); event.preventDefault();
    }
  };
  return { dialogRef, onKeyDown };
}
