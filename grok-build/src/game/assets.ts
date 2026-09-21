/** Prefix a public file so it works on `/` (preview) and `/GRIDRUNNER/ops/` (Pages). */
export function assetUrl(path: string): string {
  const clean = path.replace(/^\//, "");
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${clean}`;
}
