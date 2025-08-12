/**
 * Convert camelCase string to snake_case
 * @param str - The camelCase string to convert
 * @returns The snake_case version of the string
 *
 * @example
 * camelToSnakeCase('firstName') // 'first_name'
 * camelToSnakeCase('hasLocation') // 'has_location'
 * camelToSnakeCase('optionCount') // 'option_count'
 */
export function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert an object's keys from camelCase to snake_case
 * @param obj - The object with camelCase keys to convert
 * @returns A new object with snake_case keys
 *
 * @example
 * convertKeysToSnakeCase({ firstName: 'John', hasLocation: true })
 * // { first_name: 'John', has_location: true }
 */
export function convertKeysToSnakeCase(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnakeCase(key);
    result[snakeKey] = value;
  }

  return result;
}
