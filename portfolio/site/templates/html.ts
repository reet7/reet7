const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (char) => entities[char] ?? char);
}

type Interpolation = string | number | readonly string[] | null | undefined | false;

/** Marks a string as trusted markup so `html` does not escape it again. */
export class Markup {
  constructor(readonly value: string) {}
  toString(): string {
    return this.value;
  }
}

export const raw = (value: string): Markup => new Markup(value);

/**
 * Tagged template for build-time markup. Plain strings are escaped;
 * `Markup` values and arrays of them are inserted as-is.
 */
export function html(
  strings: TemplateStringsArray,
  ...values: (Interpolation | Markup | readonly Markup[])[]
): Markup {
  let out = strings[0] ?? '';
  values.forEach((value, index) => {
    if (Array.isArray(value)) {
      out += value
        .map((item) => (item instanceof Markup ? item.value : escapeHtml(String(item))))
        .join('');
    } else if (value instanceof Markup) {
      out += value.value;
    } else if (value !== null && value !== undefined && value !== false) {
      out += escapeHtml(String(value));
    }
    out += strings[index + 1] ?? '';
  });
  return new Markup(out);
}
