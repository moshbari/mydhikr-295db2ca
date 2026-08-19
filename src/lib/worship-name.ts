/**
 * A name reduced to what actually distinguishes it, so two spellings of the
 * same worship land on the same summary line.
 *
 * Phone keyboards quietly turn a typed `'` into `’`, so "Raka'h" and "Raka’h"
 * are different strings while being the same thing to the person who wrote
 * them. Case and stray spacing are ignored for the same reason. Only the key is
 * normalised — the name is still shown exactly as it was typed.
 */
export const worshipMatchKey = (name: string): string =>
  name
    .normalize("NFC")
    .replace(/[‘’‛ʼ´`]/g, "'")
    .replace(/[“”‟]/g, '"')
    .split(/\s+/)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
