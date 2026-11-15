/**
 * A zip file, the plainest kind: text files stored as they are, not compressed. It is how the
 * builder hands over every insignia at once, each under the file name the wiki table expects.
 * SVG is small, so storing costs little, and it keeps this to a page of code with no library.
 *
 * The result is the same bytes for the same files every time: there is no clock in it.
 */

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  table[i] = c >>> 0;
}

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const byte of bytes) c = table[(c ^ byte) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipFile {
  name: string;
  text: string;
}

/** A name safe inside a zip: no folders, no control characters, and never empty. */
export const zipName = (name: string): string => name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200) || 'file';

export function zip(files: readonly ZipFile[]): Uint8Array {
  const encoder = new TextEncoder();
  const seen = new Set<string>();
  const entries = files.map((file) => {
    // Two files with one name would overwrite each other when unpacked.
    let name = zipName(file.name);
    for (let n = 2; seen.has(name.toLowerCase()); n++) name = zipName(file.name).replace(/(\.[^.]*)?$/, ` ${n}$1`);
    seen.add(name.toLowerCase());
    const data = encoder.encode(file.text);
    return { name: encoder.encode(name), data, crc: crc32(data) };
  });

  const size = entries.reduce((sum, e) => sum + 30 + e.name.length + e.data.length + 46 + e.name.length, 22);
  const out = new Uint8Array(size);
  const view = new DataView(out.buffer);
  let at = 0;
  const u16 = (value: number) => (view.setUint16(at, value, true), (at += 2));
  const u32 = (value: number) => (view.setUint32(at, value, true), (at += 4));
  const put = (bytes: Uint8Array) => (out.set(bytes, at), (at += bytes.length));
  // 1 January 1980, the earliest date the format can say.
  const TIME = 0;
  const DATE = 0x0021;
  const UTF8 = 0x0800;

  const offsets: number[] = [];
  for (const entry of entries) {
    offsets.push(at);
    u32(0x04034b50);
    u16(20);
    u16(UTF8);
    u16(0);
    u16(TIME);
    u16(DATE);
    u32(entry.crc);
    u32(entry.data.length);
    u32(entry.data.length);
    u16(entry.name.length);
    u16(0);
    put(entry.name);
    put(entry.data);
  }
  const directory = at;
  entries.forEach((entry, i) => {
    u32(0x02014b50);
    u16(20);
    u16(20);
    u16(UTF8);
    u16(0);
    u16(TIME);
    u16(DATE);
    u32(entry.crc);
    u32(entry.data.length);
    u32(entry.data.length);
    u16(entry.name.length);
    u16(0);
    u16(0);
    u16(0);
    u16(0);
    u32(0);
    u32(offsets[i]!);
    put(entry.name);
  });
  const directorySize = at - directory;
  u32(0x06054b50);
  u16(0);
  u16(0);
  u16(entries.length);
  u16(entries.length);
  u32(directorySize);
  u32(directory);
  u16(0);
  return out;
}
