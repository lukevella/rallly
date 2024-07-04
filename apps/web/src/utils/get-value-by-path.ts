export function getValueByPath<O extends Record<string, unknown>>(
  obj: O,
  path: string,
): unknown {
  const pathArray = path.split(".");
  let curr = obj;
  for (const part of pathArray) {
    if (curr[part] === undefined) {
      return;
    }
    curr = curr[part];
  }
  return curr;
}
