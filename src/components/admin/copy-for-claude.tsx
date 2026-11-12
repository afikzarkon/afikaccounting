"use client";

import { Check, ClipboardCopy, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Copies all the feedback, with instructions, to paste into Claude; or saves it as a Markdown file. */
export function CopyForClaude({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const save = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `tester-feedback-analysis-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      save();
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={copy} title="מעתיק את כל המשוב, את הסיכום המספרי והנחיות לניתוח. מדביקים בשיחה חדשה עם Claude.">
        {copied ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
        {copied ? "הועתק. הדביקו בשיחה עם Claude" : "העתקה לניתוח עם Claude"}
      </Button>
      <Button size="sm" variant="secondary" onClick={save}>
        <FileText className="h-3.5 w-3.5" /> הורדה כקובץ
      </Button>
    </div>
  );
}
