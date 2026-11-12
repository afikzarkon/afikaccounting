"use client";

import { ClipboardPaste, Download, SquareFunction, LayoutTemplate, Sheet as SheetIcon, Trash2, X } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { isGuarded } from "@/components/layout/content-guard-view";
import { cn } from "@/lib/utils";
import { SheetBoundary } from "./sheet-boundary";
import type { BuiltSheet } from "./sheet-build";
import type { PanelKind } from "./sheet-panels";
import type { Template } from "./sheet-templates";
import type { SheetData, SheetHandle } from "./sheet-workbook";

// The workbook is a large script (about 570 KB over the wire). It starts loading as soon as
// the reader points at the button, or once the page is idle on a wide screen, so the
// sheet is ready when it opens instead of loading then.
const loadWorkbook = () => import("./sheet-workbook");
let requested = false;
const prefetch = () => {
  if (requested) return;
  requested = true;
  loadWorkbook().catch(() => (requested = false));
};

const SheetWorkbook = dynamic(loadWorkbook, {
  ssr: false,
  loading: () => <p className="p-6 text-sm text-muted">טוען את הגיליון…</p>,
});

// The help page and the templates load when first opened, not with every page.
const SheetPanel = dynamic(() => import("./sheet-panels"), { ssr: false });

/** Where a reader solves questions: the courses, review, an exam, and the engine. */
const showsOn = (pathname: string) => isGuarded(pathname) || pathname.startsWith("/engine");

// The selection must name its focus cell: without one, typing into the selected cell and pressing
// Enter makes the workbook write to an undefined row and throw.
const EMPTY: SheetData = [
  { name: "Sheet1", celldata: [], luckysheet_select_save: [{ row: [0, 0], column: [0, 0], row_focus: 0, column_focus: 0 }] },
];

/** Gives every stored selection its focus cell (sheets saved before this was set lack it). */
function withFocus(sheets: SheetData): SheetData {
  return sheets.map((sheet) => ({
    ...sheet,
    luckysheet_select_save: sheet.luckysheet_select_save?.map((s) => ({
      ...s,
      row_focus: s.row_focus ?? s.row[0],
      column_focus: s.column_focus ?? s.column[0],
    })),
  }));
}
const storeKey = (pathname: string) => `sheet:v1:${pathname}`;
const WIDTH_KEY = "sheet:v1:width";

function load(pathname: string): SheetData {
  try {
    const raw = localStorage.getItem(storeKey(pathname));
    const parsed = raw ? (JSON.parse(raw) as SheetData) : null;
    return Array.isArray(parsed) && parsed.length ? withFocus(parsed) : EMPTY;
  } catch {
    return EMPTY;
  }
}

/**
 * The workbook reports each sheet as a full grid (`data`) but builds itself from the
 * list of filled cells (`celldata`), so that list is what gets stored.
 */
function toStored(sheets: SheetData): SheetData {
  return sheets.map((sheet) => {
    const { data, ...rest } = sheet;
    const celldata = [];
    for (let r = 0; r < (data?.length ?? 0); r++) {
      const row = data![r];
      for (let c = 0; c < (row?.length ?? 0); c++) if (row[c] != null) celldata.push({ r, c, v: row[c] });
    }
    return { ...rest, celldata };
  });
}

function save(pathname: string, data: SheetData) {
  try {
    localStorage.setItem(storeKey(pathname), JSON.stringify(toStored(data)));
  } catch {
    // Storage full or blocked: the sheet still works, it just won't be there next time.
  }
}

/** Half the screen at most to begin with, so the question keeps room beside the sheet. */
const defaultWidth = () => clamp(Math.min(560, window.innerWidth * 0.45));

function clamp(w: number) {
  return Math.round(Math.min(Math.max(w, 360), window.innerWidth * 0.75));
}

/** An icon button in the sheet's title bar. */
function Tool({ label, icon: Icon, onClick }: { label: string; icon: typeof SheetIcon; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      // The cell being edited keeps the caret while a button is pressed.
      onMouseDown={(e) => e.preventDefault()}
      aria-label={label}
      title={label}
      className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg"
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}

/**
 * A scratch spreadsheet beside the question: the reader opens it, works the whole
 * exercise in it, and checks themselves. Each page keeps its own sheet in this browser.
 */
export function SheetDock() {
  const pathname = usePathname();
  const visible = showsOn(pathname);
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState<{ path: string; data: SheetData } | null>(null);
  const [version, setVersion] = useState(0);
  const [width, setWidth] = useState(560);
  const [panel, setPanel] = useState<PanelKind | null>(null);
  const [notice, setNotice] = useState("");
  const timer = useRef<number | undefined>(undefined);
  const pending = useRef<{ path: string; data: SheetData } | null>(null);
  const workbook = useRef<SheetHandle>(null);

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    if (pending.current) save(pending.current.path, pending.current.data);
    pending.current = null;
  }, []);

  // Moving to another page while the sheet is open brings that page's sheet; the last
  // one's pending edits keep their own path, so they still land where they belong.
  if (open && sheet && sheet.path !== pathname) setSheet({ path: pathname, data: load(pathname) });

  useEffect(() => flush, [flush]);

  useEffect(() => {
    if (!visible || requested) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData || !window.matchMedia("(min-width: 768px)").matches) return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const id = idle(prefetch, { timeout: 5000 });
    return () => cancel(id);
  }, [visible]);

  const openSheet = () => {
    try {
      const w = Number(localStorage.getItem(WIDTH_KEY));
      setWidth(w ? clamp(w) : defaultWidth());
    } catch {
      setWidth(defaultWidth());
    }
    setSheet({ path: pathname, data: load(pathname) });
    setOpen(true);
  };

  // On a wide screen the page moves aside so the question stays readable next to the sheet.
  useEffect(() => {
    const root = document.documentElement;
    if (open && visible) {
      root.dataset.sheet = "open";
      root.style.setProperty("--sheet-w", `${width}px`);
    } else {
      delete root.dataset.sheet;
    }
    return () => {
      delete root.dataset.sheet;
    };
  }, [open, visible, width]);

  const onChange = useCallback(
    (next: SheetData) => {
      pending.current = { path: pathname, data: next };
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, 400);
    },
    [pathname, flush],
  );

  const clear = () => {
    if (!window.confirm("לנקות את הגיליון של העמוד הזה?")) return;
    window.clearTimeout(timer.current);
    pending.current = null;
    try {
      localStorage.removeItem(storeKey(pathname));
    } catch {}
    setSheet({ path: pathname, data: EMPTY });
    setVersion((v) => v + 1);
  };

  /** A short line under the title that goes away by itself. */
  const say = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice((now) => (now === text ? "" : now)), 4000);
  };

  /** Adds a built sheet as a new tab in front; the reader's own sheets stay as they are. */
  const addSheet = async (build: () => Promise<BuiltSheet | null>) => {
    const added = await build();
    if (!added) return false;
    const { withSheet } = await import("./sheet-build");
    window.clearTimeout(timer.current);
    pending.current = null;
    const current = workbook.current?.sheets();
    const next = withSheet(toStored(current?.length ? current : load(pathname)), added) as SheetData;
    save(pathname, next);
    setSheet({ path: pathname, data: next });
    setVersion((v) => v + 1);
    setPanel(null);
    return true;
  };

  const addTemplate = (t: Template) =>
    addSheet(async () => {
      const { buildSheet } = await import("./sheet-build");
      return buildSheet(t.name, t.rows, t.widths);
    });

  /** Copies the question's data on the page into a new tab, so nothing has to be retyped. */
  const addPageData = async () => {
    const ok = await addSheet(async () => {
      const [{ collectPageData, pageSheet }, { buildSheet }] = await Promise.all([import("./sheet-page-data"), import("./sheet-build")]);
      const blocks = collectPageData(document.querySelector("main") ?? document.body, pathname.startsWith("/engine"));
      if (!blocks.length) return null;
      const { rows, widths } = pageSheet(blocks);
      return buildSheet("נתוני השאלה", rows, widths);
    });
    say(ok ? "נתוני השאלה נוספו בלשונית חדשה." : "לא נמצאו בעמוד הזה נתונים להעברה.");
  };

  const download = async () => {
    const sheets = workbook.current?.sheets();
    if (!sheets?.length) return;
    const { toXlsx } = await import("./sheet-xlsx");
    const ordered = [...sheets].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const bytes = toXlsx(ordered as Parameters<typeof toXlsx>[0]);
    const url = URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "AfikAccounting.xlsx";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  // While dragging, the width goes straight to the page's style, once a frame;
  // React hears of it only when the drag ends.
  const aside = useRef<HTMLElement>(null);
  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    let frame = 0;
    const move = (ev: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const w = `${clamp(ev.clientX)}px`;
        document.documentElement.style.setProperty("--sheet-w", w);
        aside.current?.style.setProperty("--sheet-w", w);
      });
    };
    const up = (ev: PointerEvent) => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const w = clamp(ev.clientX);
      setWidth(w);
      try {
        localStorage.setItem(WIDTH_KEY, String(w));
      } catch {}
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  if (!visible) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={openSheet}
        onPointerEnter={prefetch}
        onFocus={prefetch}
        onTouchStart={prefetch}
        aria-label="גיליון אקסל"
        title="גיליון אקסל"
        className={cn(
          // A phone: a small round button above the bottom bar — the tab bar, or a lesson's "previous / next" bar, which is taller — so it never covers "next".
          "no-print fixed left-3 z-40 flex size-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface text-sm font-semibold text-fg shadow-lg transition hover:border-accent hover:text-accent md:bottom-6 md:left-4 md:size-auto md:px-4 md:py-2.5",
          pathname.startsWith("/study/") ? "bottom-[calc(6.5rem+env(safe-area-inset-bottom))]" : "bottom-[calc(5rem+env(safe-area-inset-bottom))]",
        )}
      >
        <SheetIcon className="size-5 md:size-4" aria-hidden />
        <span className="hidden md:inline">גיליון אקסל</span>
      </button>
    );
  }

  return (
    <aside
      ref={aside}
      data-sheet
      aria-label="גיליון עבודה"
      style={{ "--sheet-w": `${width}px` } as React.CSSProperties}
      className="no-print fixed inset-x-0 bottom-0 z-50 flex h-[78dvh] flex-col rounded-t-2xl border border-line-strong bg-surface shadow-2xl md:inset-y-0 md:right-auto md:left-0 md:h-auto md:w-[var(--sheet-w)] md:rounded-none md:border-y-0 md:border-l-0"
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="שינוי רוחב הגיליון"
        onPointerDown={startResize}
        className="absolute inset-y-0 -right-1.5 z-10 hidden w-3 cursor-col-resize md:block"
      />
      <header className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <SheetIcon className="size-4 text-accent" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">גיליון עבודה</p>
          <p role="status" className="truncate text-xs text-muted">
            {notice || "נשמר אוטומטית בדפדפן הזה, לכל עמוד בנפרד."}
          </p>
        </div>
        <Tool label="נתוני השאלה לגיליון" icon={ClipboardPaste} onClick={addPageData} />
        <Tool label="תבניות מוכנות" icon={LayoutTemplate} onClick={() => setPanel(panel === "templates" ? null : "templates")} />
        <Tool label="פונקציות וקיצורי מקלדת" icon={SquareFunction} onClick={() => setPanel(panel === "help" ? null : "help")} />
        <Tool label="הורדה כקובץ אקסל" icon={Download} onClick={download} />
        <Tool label="ניקוי הגיליון" icon={Trash2} onClick={clear} />
        <button
          type="button"
          onClick={() => {
            flush();
            setOpen(false);
          }}
          aria-label="סגירת הגיליון"
          className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg"
        >
          <X className="size-4" aria-hidden />
        </button>
      </header>
      <div dir="ltr" className="relative min-h-0 flex-1">
        {sheet?.path === pathname && (
          <SheetBoundary
            onReset={() => {
              flush();
              setSheet({ path: pathname, data: load(pathname) });
              setVersion((v) => v + 1);
            }}
          >
            <SheetWorkbook key={`${pathname}:${version}`} data={sheet.data} onChange={onChange} handle={workbook} />
          </SheetBoundary>
        )}
        {panel && (
          <SheetPanel
            kind={panel}
            onClose={() => setPanel(null)}
            onPick={addTemplate}
            onInsert={(text) => {
              setPanel(null);
              workbook.current?.type(text);
            }}
          />
        )}
      </div>
    </aside>
  );
}
