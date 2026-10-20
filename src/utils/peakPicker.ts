/**
 * 後台「從百岳總表挑選」：把使用者輸入的編號／範圍／山名／群組，
 * 對照內建的 data/peaks-top100.json，產生要匯入的百岳清單。
 *
 * 支援的輸入（用逗號、頓號或空白分隔）：
 *   1, 8, 12-15     編號與範圍
 *   玉山, 雪山       山名（需完全相同）
 *   五岳, 三尖       群組（整組一次加入）
 */
export interface PickerPeak {
  no: number;
  name: string;
  group?: string;
  [key: string]: any;
}

export interface PeakPickResult<T extends PickerPeak> {
  selected: T[];
  /** 無法對應的輸入，附上原因或建議 */
  unmatched: string[];
}

const stripGroupIndex = (g: string) => g.replace(/[-－]\d+$/, '').trim();

export function parsePeakSelection<T extends PickerPeak>(
  input: string,
  peaks: T[]
): PeakPickResult<T> {
  const picked = new Map<number, T>();
  const unmatched: string[] = [];

  const tokens = (input || '')
    .split(/[,，、;；\s\u3000]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  for (const token of tokens) {
    const range = token.match(/^(\d{1,3})\s*[-~–－～]\s*(\d{1,3})$/);
    if (range) {
      let a = Number(range[1]);
      let b = Number(range[2]);
      if (a > b) [a, b] = [b, a];
      const hits = peaks.filter((p) => p.no >= a && p.no <= b);
      if (hits.length === 0) unmatched.push(`${token}（範圍內沒有百岳）`);
      hits.forEach((p) => picked.set(p.no, p));
      continue;
    }

    if (/^\d{1,3}$/.test(token)) {
      const hit = peaks.find((p) => p.no === Number(token));
      if (hit) picked.set(hit.no, hit);
      else unmatched.push(`${token}（沒有這個編號）`);
      continue;
    }

    const byName = peaks.filter((p) => p.name === token);
    if (byName.length > 0) {
      byName.forEach((p) => picked.set(p.no, p));
      continue;
    }

    const byGroup = peaks.filter((p) => stripGroupIndex(String(p.group || '')) === token);
    if (byGroup.length > 0) {
      byGroup.forEach((p) => picked.set(p.no, p));
      continue;
    }

    const similar = peaks.filter((p) => p.name.includes(token)).slice(0, 4);
    unmatched.push(
      similar.length > 0
        ? `${token}（找不到完全相同的山名，你是指：${similar.map((p) => p.name).join('、')}？）`
        : `${token}（找不到）`
    );
  }

  const selected = Array.from(picked.values()).sort((x, y) => x.no - y.no);
  return { selected, unmatched };
}
