"use client";

import { Gauge, Maximize, Pause, Play, PlayCircle, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { recordProgress } from "@/lib/actions/history";
import { track } from "@/lib/analytics/track";
import type { ContentItem } from "@/lib/content/types";
import { DEMO_VIDEO_URL } from "@/lib/env";
import { duration } from "@/lib/engine/format";
import { type Embed, embedUrl, parseEmbed, thumbnailUrl } from "@/lib/media/embed";
import { cn } from "@/lib/utils";

export type PlayableItem = Pick<ContentItem, "slug" | "title" | "videoUrl" | "durationSeconds" | "chapters">;

const SPEEDS = [1, 1.25, 1.5, 2];
/** Seconds of playback between progress saves. */
const SAVE_EVERY = 20;

type PlayerProps = {
  item: PlayableItem;
  startAt?: number;
  /** Save progress to the user's watch history (ignored for guests). */
  track?: boolean;
  layout?: "side" | "stacked";
  className?: string;
};

/** A YouTube or Vimeo link plays in that service's embed; anything else in the built-in player. */
export function VideoPlayer(props: PlayerProps) {
  const embed = parseEmbed(props.item.videoUrl);
  return embed ? <EmbedPlayer {...props} embed={embed} /> : <FilePlayer {...props} />;
}

/** Counts the first play of a mounted player in the usage analytics. */
function usePlayTracker(item: PlayableItem, source: "upload" | "youtube" | "vimeo" | "demo") {
  const counted = useRef(false);
  return useCallback(() => {
    if (counted.current) return;
    counted.current = true;
    track({ kind: "video_play", target: item.slug, label: item.title, source });
  }, [item.slug, item.title, source]);
}

/**
 * Player with chapter navigation. Lessons without a recording play a simulated
 * timeline, so chapters, seeking and progress tracking behave the same way.
 */
function FilePlayer({
  item,
  startAt = 0,
  track = true,
  layout = "side",
  className,
}: PlayerProps) {
  const src = item.videoUrl || DEMO_VIDEO_URL || null;
  const countPlay = usePlayTracker(item, item.videoUrl ? "upload" : "demo");
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(startAt);
  const timeRef = useRef(startAt);
  const [total, setTotal] = useState(item.durationSeconds);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const lastSaved = useRef(startAt);
  const completed = useRef(false);

  const save = useCallback(
    (seconds: number, done = false) => {
      if (!track) return;
      lastSaved.current = seconds;
      recordProgress(item.slug, seconds, done).catch(() => {});
    },
    [item.slug, track],
  );

  const onProgress = useCallback(
    (t: number) => {
      timeRef.current = t;
      setTime(t);
      if (Math.abs(t - lastSaved.current) >= SAVE_EVERY) save(t);
    },
    [save],
  );

  const finish = useCallback(() => {
    setPlaying(false);
    if (!completed.current) {
      completed.current = true;
      save(total, true);
    }
  }, [save, total]);

  // Simulated playback for lessons without a recording.
  useEffect(() => {
    if (src || !playing) return;
    const id = setInterval(() => {
      const next = Math.min(timeRef.current + speed, total);
      timeRef.current = next;
      setTime(next);
      if (next >= total) finish();
      else if (Math.abs(next - lastSaved.current) >= SAVE_EVERY) save(next);
    }, 1000);
    return () => clearInterval(id);
  }, [src, playing, speed, total, finish, save]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  const seek = (t: number, autoplay = true) => {
    const target = Math.max(0, Math.min(t, total));
    timeRef.current = target;
    setTime(target);
    // Replaying from the end starts a fresh viewing.
    if (target < total) completed.current = false;
    const v = videoRef.current;
    if (v) {
      v.currentTime = target;
      if (autoplay) v.play().catch(() => {});
    } else if (autoplay) setPlaying(true);
  };

  const toggle = () => {
    const v = videoRef.current;
    if (v) {
      if (v.paused) v.play().catch(() => {});
      else v.pause();
      return;
    }
    if (playing) save(time);
    else {
      countPlay();
      if (timeRef.current >= total) seek(0, false);
    }
    setPlaying((p) => !p);
  };

  const chapters = [...item.chapters].sort((a, b) => a.at - b.at);
  const current = chapters.findLast((c) => c.at <= time);
  const pct = total > 0 ? (time / total) * 100 : 0;

  return (
    <div className={cn(layout === "side" ? "grid gap-5 lg:grid-cols-[1fr_320px]" : "space-y-4", className)}>
      <div
        ref={frameRef}
        // Media controls keep the conventional left-to-right timeline.
        dir="ltr"
        className="group/player relative overflow-hidden rounded-2xl border border-line bg-[#030712] shadow-card"
      >
        <div className="relative aspect-video">
          {src ? (
            <video
              ref={videoRef}
              src={src}
              muted={muted}
              playsInline
              preload="metadata"
              className="h-full w-full"
              onClick={toggle}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (Number.isFinite(v.duration)) setTotal(Math.round(v.duration));
                if (startAt) v.currentTime = startAt;
              }}
              onPlay={() => {
                setPlaying(true);
                countPlay();
              }}
              onPause={(e) => {
                setPlaying(false);
                save(e.currentTarget.currentTime);
              }}
              onTimeUpdate={(e) => onProgress(e.currentTarget.currentTime)}
              onEnded={finish}
            />
          ) : (
            <SimulatedScreen title={item.title} chapter={current?.title} playing={playing} onToggle={toggle} />
          )}
        </div>

        {/* Controls */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-4 pt-10 pb-3 text-white">
          <Scrubber
            pct={pct}
            total={total}
            chapters={chapters}
            onSeek={(t) => seek(t, playing)}
          />
          <div className="mt-2 flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={toggle}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/15 transition hover:bg-white/25"
              aria-label={playing ? "השהיה" : "ניגון"}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
            </button>
            <span className="num text-xs text-white/80">
              {duration(time)} / {duration(total)}
            </span>
            {current && <span className="hidden truncate text-xs text-white/60 sm:inline">· {current.title}</span>}
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])}
                className="flex h-8 items-center gap-1 rounded-md px-2 text-xs text-white/80 hover:bg-white/10"
                aria-label={`מהירות ניגון ${speed}x`}
              >
                <Gauge className="h-3.5 w-3.5" /> {speed}x
              </button>
              {src && (
                <>
                  <button
                    type="button"
                    onClick={() => setMuted((m) => !m)}
                    className="grid h-8 w-8 place-items-center rounded-md text-white/80 hover:bg-white/10"
                    aria-label={muted ? "ביטול השתקה" : "השתקה"}
                  >
                    {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => frameRef.current?.requestFullscreen?.().catch(() => {})}
                    className="grid h-8 w-8 place-items-center rounded-md text-white/80 hover:bg-white/10"
                    aria-label="מסך מלא"
                  >
                    <Maximize className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {chapters.length > 0 && (
        <ChapterList chapters={chapters} activeAt={current?.at} total={total} onSelect={(t) => seek(t)} compact={layout === "stacked"} />
      )}
    </div>
  );
}

function Scrubber({
  pct,
  total,
  chapters,
  onSeek,
}: {
  pct: number;
  total: number;
  chapters: ContentItem["chapters"];
  onSeek: (t: number) => void;
}) {
  return (
    <div className="group/scrub relative h-4">
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/20 transition-all group-hover/scrub:h-1.5">
        <div className="h-full rounded-full bg-gradient-to-r from-accent to-cyan-400" style={{ width: `${pct}%` }} />
      </div>
      {total > 0 &&
        chapters.map((c) =>
          c.at > 0 ? (
            <span
              key={c.at}
              className="pointer-events-none absolute top-1/2 h-2.5 w-0.5 -translate-y-1/2 rounded bg-black/70"
              style={{ left: `${(c.at / total) * 100}%` }}
            />
          ) : null,
        )}
      <input
        type="range"
        min={0}
        max={total}
        step={1}
        value={Math.round((pct / 100) * total)}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="absolute inset-0 w-full cursor-pointer opacity-0"
        aria-label="מיקום בסרטון"
      />
    </div>
  );
}

function SimulatedScreen({
  title,
  chapter,
  playing,
  onToggle,
}: {
  title: string;
  chapter?: string;
  playing: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden text-center"
      aria-label={playing ? "השהיה" : "ניגון"}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgb(79_139_255_/_0.35),transparent_55%),radial-gradient(ellipse_at_80%_80%,rgb(34_211_238_/_0.22),transparent_50%)]" />
      <div className="bg-grid absolute inset-0 opacity-40 [--grid:rgb(148_163_184_/_0.08)]" />
      <div className="relative px-8" dir="rtl">
        <p className="text-[11px] font-semibold text-cyan-300/80">תצוגה מקדימה של השיעור</p>
        <p className="mt-2 text-lg font-semibold text-white sm:text-2xl">{chapter ?? title}</p>
        {chapter && <p className="mt-1 text-sm text-white/60">{title}</p>}
        {!playing && <PlayCircle className="mx-auto mt-6 h-14 w-14 text-white/85 transition group-hover/player:scale-105" />}
        <p className="mt-4 text-[11px] text-white/45">ההקלטה טרם הועלתה — ציר הזמן מדומה.</p>
      </div>
    </button>
  );
}

function ChapterList({
  chapters,
  activeAt,
  total,
  onSelect,
  compact,
}: {
  chapters: ContentItem["chapters"];
  activeAt?: number;
  total: number;
  onSelect: (t: number) => void;
  compact?: boolean;
}) {
  return (
    <div dir="rtl" className={cn("card overflow-hidden", !compact && "lg:max-h-[min(70vh,560px)] lg:overflow-y-auto")}>
      <p className="sticky top-0 border-b border-line bg-surface px-4 py-3 text-xs font-semibold text-muted">
        פרקים · {chapters.length}
      </p>
      <ol className={cn("divide-y divide-line", compact && "max-h-64 overflow-y-auto")}>
        {chapters.map((c, i) => {
          const active = c.at === activeAt;
          const end = chapters[i + 1]?.at ?? total;
          return (
            <li key={c.at}>
              <button
                type="button"
                onClick={() => onSelect(c.at)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors",
                  active ? "bg-accent-soft" : "hover:bg-surface-2",
                )}
              >
                <span
                  className={cn(
                    "num mt-px shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px]",
                    active ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
                  )}
                >
                  {duration(c.at)}
                </span>
                <span className="min-w-0">
                  <span className={cn("block leading-snug", active ? "font-medium text-fg" : "text-fg/90")}>{c.title}</span>
                  <span className="text-xs text-subtle">{duration(Math.max(0, end - c.at))}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * A YouTube or Vimeo video. The iframe loads only when the viewer presses play
 * (no third-party requests before that), and a chapter restarts it at its time.
 */
function EmbedPlayer({ item, startAt = 0, layout = "side", className, embed }: PlayerProps & { embed: Embed }) {
  const [start, setStart] = useState<number | null>(null);
  const countPlay = usePlayTracker(item, embed.source);
  const chapters = [...item.chapters].sort((a, b) => a.at - b.at);
  const play = (t: number) => {
    countPlay();
    setStart(t);
  };
  const thumb = thumbnailUrl(embed);
  const activeAt = start === null ? undefined : chapters.findLast((c) => c.at <= start)?.at;

  return (
    <div className={cn(layout === "side" ? "grid gap-5 lg:grid-cols-[1fr_320px]" : "space-y-4", className)}>
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-line bg-[#030712] shadow-card">
        {start === null ? (
          <button
            type="button"
            onClick={() => play(startAt)}
            className="group/embed absolute inset-0 grid place-items-center text-white"
            aria-label={`ניגון: ${item.title}`}
          >
            {thumb && (
              // eslint-disable-next-line @next/next/no-img-element -- a remote thumbnail shown once; no optimisation needed.
              <img src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
            )}
            <span className="relative grid place-items-center gap-3 text-center">
              <PlayCircle className="h-16 w-16 drop-shadow transition group-hover/embed:scale-105" />
              <span className="rounded-full bg-black/55 px-3 py-1 text-xs">{embed.source === "youtube" ? "YouTube" : "Vimeo"}</span>
            </span>
          </button>
        ) : (
          <iframe
            key={start}
            src={embedUrl(embed, start)}
            title={item.title}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        )}
      </div>
      {chapters.length > 0 && (
        <ChapterList chapters={chapters} activeAt={activeAt} total={item.durationSeconds} onSelect={play} compact={layout === "stacked"} />
      )}
    </div>
  );
}
