// Original geometric block letters, drawn on a 200x100 grid and stretched to fill each slot.
const glyphs: Record<string, string> = {
  R: 'M0 0H180L200 14V44L188 54L200 64V100H132V66H64V100H0ZM64 16V48H132V16Z',
  E: 'M14 0H200V32H64V42H168V58H64V68H200V100H14L0 86V14Z',
  T: 'M0 0H200V38H132V100H68V38H0Z',
  A: 'M28 0H172L200 28V100H132V70H68V100H0V28ZM68 28V52H132V28Z',
  B: 'M0 0H180L200 16V40L188 50L200 60V84L180 100H0ZM64 16V42H136V16ZM64 58V84H136V58Z',
  O: 'M24 0H176L200 18V82L176 100H24L0 82V18ZM90 16V84H110V16Z',
  U: 'M0 0H64V84H136V0H200V82L176 100H24L0 82Z',
};

export function letterSvg(ch: string): string {
  const d = glyphs[ch.toUpperCase()];
  if (!d) return `<span class="wm-fallback">${ch}</span>`;
  return `<svg viewBox="0 0 200 100" preserveAspectRatio="none" focusable="false"><path fill-rule="evenodd" d="${d}"/></svg>`;
}
