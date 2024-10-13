export function getValueByPath<O extends Record<string, unknown>>(
  obj: O,
  path: string,
): unknown {
  const pathArray = path.split(".");
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  let curr: any = obj;
  for (const part of pathArray) {
    if (curr[part] === undefined) {
      return undefined;
    }
    curr = curr[part];
  }
  return curr;
}
