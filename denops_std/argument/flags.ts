import { parsePattern } from "./util.ts";

export type Flags = Record<string, string | string[] | undefined>;

const longPattern = /^--([a-zA-Z0-9-]+)(?:=(.*))?/;
const shortPattern = /^-([a-zA-Z0-9])(.*)/;

/**
 * Parse string array to extract flags (-f/--flag).
 */
export function parseFlags(args: string[]): [Flags, string[]] {
  const patterns = [longPattern, shortPattern];
  const flags: Flags = {};
  const residue: string[] = [];
  loop:
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--") {
      residue.push(...args.slice(i));
      break;
    }
    for (const pattern of patterns) {
      const r = parsePattern(arg, pattern);
      if (r) {
        const [k, v] = r;
        const b = flags[k];
        if (b != undefined) {
          flags[k] = Array.isArray(b) ? [...b, v] : [b, v];
        } else {
          flags[k] = v;
        }
        continue loop;
      }
    }
    residue.push(arg);
  }
  return [flags, residue];
}

/**
 * Validate if `flags` has unknown attributes.
 */
export function validateFlags(flags: Flags, knownAttributes: string[]): void {
  Object.keys(flags).forEach((v) => {
    if (!knownAttributes.includes(v)) {
      if (v.length === 1) {
        throw new Error(`Unknown flag '-${v}' is specified.`);
      } else {
        throw new Error(`Unknown flag '--${v}' is specified.`);
      }
    }
  });
}

/**
 * Format `key` and `value` to construct string array.
 */
export function formatFlag(
  key: string,
  value: string | string[] | undefined,
): string[] {
  if (value == undefined) {
    return [];
  }
  value = Array.isArray(value) ? value : [value];
  if (key.length === 1) {
    return value.map((v) => v ? `-${key}${v}` : `-${key}`);
  } else {
    return value.map((v) => v ? `--${key}=${v}` : `--${key}`);
  }
}

/**
 * Format `flags` to construct string array.
 */
export function formatFlags(flags: Flags, includes?: string[]): string[] {
  let entries = Object.entries(flags);
  if (includes != undefined) {
    entries = entries.filter(([k, _]) => includes.includes(k));
  }
  return entries.map(([k, v]) => formatFlag(k, v)).flat();
}
