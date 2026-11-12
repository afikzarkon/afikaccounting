import { type RefObject, useLayoutEffect } from "react";

/**
 * Closes a modal <dialog> when its page is hidden or removed.
 *
 * With Cache Components, Next.js keeps the page you left in the document, hidden
 * (React's Activity), instead of removing it. A dialog opened with showModal() and
 * left open there is no longer drawn, but it is still the document's modal: every
 * click on the page shown after it is blocked, while scrolling goes on working,
 * until a reload. Leaving with the dialog open is easy: the browser's Back, or a
 * link inside the dialog. Every dialog opened with showModal() uses this.
 */
export function useCloseWhenHidden(ref: RefObject<HTMLDialogElement | null>) {
  useLayoutEffect(() => {
    const dialog = ref.current;
    // The cleanup runs when the page is hidden, as it does when it is removed.
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, [ref]);
}
