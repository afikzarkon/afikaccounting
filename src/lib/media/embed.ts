/** A YouTube or Vimeo link, recognised and turned into an embeddable player URL. */
export type Embed = { source: "youtube" | "vimeo"; id: string };

const YOUTUBE = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i;
const VIMEO = /vimeo\.com\/(?:video\/|channels\/[\w-]+\/|groups\/[\w-]+\/videos\/)?(\d{6,12})/i;

export function parseEmbed(url: string | null | undefined): Embed | null {
  if (!url) return null;
  const yt = url.match(YOUTUBE);
  if (yt) return { source: "youtube", id: yt[1] };
  const vm = url.match(VIMEO);
  if (vm) return { source: "vimeo", id: vm[1] };
  return null;
}

/** The iframe URL, starting at `start` seconds; autoplay once the viewer has asked to play. */
export function embedUrl(e: Embed, start = 0, autoplay = true) {
  const s = Math.max(0, Math.floor(start));
  if (e.source === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${e.id}?rel=0&modestbranding=1&start=${s}${autoplay ? "&autoplay=1" : ""}`;
  }
  return `https://player.vimeo.com/video/${e.id}?dnt=1${autoplay ? "&autoplay=1" : ""}#t=${s}s`;
}

export function thumbnailUrl(e: Embed) {
  return e.source === "youtube" ? `https://i.ytimg.com/vi/${e.id}/hqdefault.jpg` : null;
}
