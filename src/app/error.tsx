"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-danger/10 text-danger">
        <TriangleAlert className="h-7 w-7" />
      </span>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-fg">משהו השתבש</h1>
      <p className="mt-2 max-w-md text-muted">
        אירעה שגיאה לא צפויה. נסו שוב — אם זה חוזר, ספרו לנו.
        {digest && <span className="mt-2 block font-mono text-xs text-subtle">מזהה: {digest}</span>}
      </p>
      <Button className="mt-8" onClick={retry}>
        <RotateCcw className="h-4 w-4" /> ניסיון חוזר
      </Button>
    </Container>
  );
}
