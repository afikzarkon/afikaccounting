"use client";

import { Sheet as SheetIcon, Trash2, X } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { isGuarded } from "@/components/layout/content-guard-view";
import type { SheetData } from "./sheet-workbook";

const SheetWorkbook = dynamic(() => import("./sheet-workbook"), {
  ssr: false,
  loading: () => <p className="p-6 text-sm text-muted">טוען את הגיליון…</p>,
});

/** Where a reader solves questions: the courses, review, an exam, and the engine. */
const showsOn = (pathname: string) => isGuarded(pathname) || pathname.startsWith("/engine");

const EMPTY: SheetData = [{ name: "Sheet1", celldata: [], luckysheet_select_save: [{ row: [0, 0], column: [0, 0] }] }];
const storeKey = (pathname: string) => `sheet:v1:${pathname}`;
const WIDTH_KEY = "sheet:v1:width";

function load(pathname: string): SheetData {
  try {
    const raw = localStorage.getItem(storeKey(pathname));
    const parsed = raw ? (JSON.parse(raw) as SheetData) : null;
    return Array.isArray(parsed) && parsed.length ? parsed : EMPTY;
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

function clamp(w: number) {
  return Math.round(Math.min(Math.max(w, 360), window.innerWidth * 0.75));
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
  const timer = useRef<number | undefined>(undefined);
  const pending = useRef<{ path: string; data: SheetData } | null>(null);

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    if (pending.current) save(pending.current.path, pending.current.data);
    pending.current = null;
  }, []);

  // Moving to another page while the sheet is open brings that page's sheet; the last
  // one's pending edits keep their own path, so they still land where they belong.
  if (open && sheet && sheet.path !== pathname) setSheet({ path: pathname, data: load(pathname) });

  useEffect(() => flush, [flush]);

  const openSheet = () => {
    try {
      const w = Number(localStorage.getItem(WIDTH_KEY));
      if (w) setWidth(clamp(w));
    } catch {}
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

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const move = (ev: PointerEvent) => setWidth(clamp(ev.clientX));
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      try {
        localStorage.setItem(WIDTH_KEY, String(clamp(ev.clientX)));
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
        className="no-print fixed bottom-20 left-4 z-40 flex items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2.5 text-sm font-semibold text-fg shadow-lg transition hover:border-accent hover:text-accent md:bottom-6"
      >
        <SheetIcon className="size-4" aria-hidden />
        גיליון אקסל
      </button>
    );
  }

  return (
    <aside
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
          <p className="truncate text-xs text-muted">נוסחאות כמו באקסל (‎=SUM(A1:A5)‎). נשמר אוטומטית בדפדפן הזה, לכל עמוד בנפרד.</p>
        </div>
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted transition hover:bg-surface-2 hover:text-fg"
        >
          <Trash2 className="size-3.5" aria-hidden />
          ניקוי
        </button>
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
        {sheet?.path === pathname && <SheetWorkbook key={`${pathname}:${version}`} data={sheet.data} onChange={onChange} />}
      </div>
    </aside>
  );
}
