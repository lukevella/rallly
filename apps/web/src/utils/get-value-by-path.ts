export function getValueByPath<O extends Record<string, unknown>>(
  obj: O,
  path: string,
): unknown {
  const pathArray = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let curr: any = obj;
  for (const part of pathArray) {
    if (curr[part] === undefined) {
      return undefined;
    }
    curr = curr[part];
  }
  return curr;
}
