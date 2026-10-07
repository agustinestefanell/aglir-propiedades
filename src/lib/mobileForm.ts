import type { FocusEvent } from "react";

// onFocus para <form> (o contenedor) en mobile: cuando se enfoca un campo, lo sube
// al centro del área visible para que no quede bajo el teclado virtual.
// El delay espera a que el teclado termine de abrirse (y el viewport de achicarse).
export function scrollFocusedFieldIntoView(e: FocusEvent<HTMLElement>) {
  const target = e.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
  if (target.type === "file" || target.type === "checkbox") return;
  window.setTimeout(() => {
    target.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 300);
}
