import { createPortal } from "react-dom";

export function ModalLayer({ children }: { children: React.ReactNode }) {
  return typeof document === "undefined" ? children : createPortal(children, document.body);
}
