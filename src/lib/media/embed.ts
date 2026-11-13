/** A YouTube, Vimeo or Bunny Stream link, recognised and turned into an embeddable player URL. */
export type Embed = { source: "youtube" | "vimeo" | "bunny"; id: string };

const YOUTUBE = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i;
const VIMEO = /vimeo\.com\/(?:video\/|channels\/[\w-]+\/|groups\/[\w-]+\/videos\/)?(\d{6,12})/i;
/** Bunny Stream: library id and video GUID, on the player's current or legacy host. */
const BUNNY = /(?:iframe|player)\.mediadelivery\.net\/(?:embed|play)\/(\d+)\/([0-9a-f-]{36})/i;

export function parseEmbed(url: string | null | undefined): Embed | null {
  if (!url) return null;
  const yt = url.match(YOUTUBE);
  if (yt) return { source: "youtube", id: yt[1] };
  const vm = url.match(VIMEO);
  if (vm) return { source: "vimeo", id: vm[1] };
  const bn = url.match(BUNNY);
  if (bn) return { source: "bunny", id: `${bn[1]}/${bn[2].toLowerCase()}` };
  return null;
}

/** The service's name, as the player and the admin show it. */
export const EMBED_NAMES: Record<Embed["source"], string> = { youtube: "YouTube", vimeo: "Vimeo", bunny: "Bunny Stream" };

/** The iframe URL, starting at `start` seconds; autoplay once the viewer has asked to play. */
export function embedUrl(e: Embed, start = 0, autoplay = true) {
  const s = Math.max(0, Math.floor(start));
  if (e.source === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${e.id}?rel=0&modestbranding=1&start=${s}${autoplay ? "&autoplay=1" : ""}`;
  }
  if (e.source === "bunny") {
    return `https://iframe.mediadelivery.net/embed/${e.id}?autoplay=${autoplay}&preload=true&responsive=true&t=${s}`;
  }
  return `https://player.vimeo.com/video/${e.id}?dnt=1${autoplay ? "&autoplay=1" : ""}#t=${s}s`;
}

export function thumbnailUrl(e: Embed) {
  return e.source === "youtube" ? `https://i.ytimg.com/vi/${e.id}/hqdefault.jpg` : null;
}
