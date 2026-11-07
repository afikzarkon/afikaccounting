"use client";

import { Component, type ReactNode } from "react";

/**
 * If the spreadsheet library throws, only the sheet stops — not the lesson beside it.
 * The reader reopens it from what was last saved.
 */
export class SheetBoundary extends Component<{ children: ReactNode; onReset: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Spreadsheet error", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div dir="rtl" className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-fg">הגיליון נתקע. מה שנשמר עד עכשיו לא אבד.</p>
        <button
          type="button"
          onClick={() => {
            this.setState({ failed: false });
            this.props.onReset();
          }}
          className="rounded-lg border border-line-strong px-3 py-1.5 text-sm font-semibold text-fg transition hover:border-accent hover:text-accent"
        >
          פתיחה מחדש
        </button>
      </div>
    );
  }
}
