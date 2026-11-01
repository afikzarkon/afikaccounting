/**
 * A stable shuffle for answer options and offered accounts. The lessons write
 * the right answer first and the entry's accounts together; shown as written,
 * a reader would learn the position instead of the answer. The order comes
 * from the question's own text, so it is the same on the server and in the
 * browser, on every visit — and the code keeps the original indexes, so a
 * saved answer and every explanation still point at the option they were
 * written for.
 */

/** FNV-1a: a number from a string. */
function hash(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32, seeded by the key. */
function random(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The original indexes 0…n−1 in a display order fixed by the key. */
export function stableOrder(key: string, n: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  const r = random(hash(key));
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** The items in the key's display order. */
export const stableShuffle = <T>(key: string, items: readonly T[]): T[] => stableOrder(key, items.length).map((i) => items[i]);
