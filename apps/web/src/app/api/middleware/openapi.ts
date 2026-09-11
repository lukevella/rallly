import type { loadVendor } from "hono-openapi";
import * as z from "zod";

type ToOpenApiSchema = NonNullable<
  Parameters<typeof loadVendor>[1]["toOpenAPISchema"]
>;
// hono-openapi's own converter returns `{ $ref }` nodes too; only its type
// omits them.
type OpenApiSchema = Awaited<ReturnType<ToOpenApiSchema>>;

const DEFS_PREFIX = "#/$defs/";
const COMPONENTS_PREFIX = "#/components/schemas/";

// Rewrites `$defs` refs to `components.schemas`, and drops the regex zod
// emits beside every `format` (its ISO date pattern is 200 characters and
// says nothing the format does not): readers and generators use the format.
function rewriteRefs(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(rewriteRefs);
  }
  if (!node || typeof node !== "object") {
    return node;
  }
  const hasFormat = "format" in node && typeof node.format === "string";
  return Object.fromEntries(
    Object.entries(node)
      .filter(([key]) => !(hasFormat && key === "pattern"))
      .map(([key, value]) => [
        key,
        key === "$ref" && typeof value === "string"
          ? value.replace(DEFS_PREFIX, COMPONENTS_PREFIX)
          : rewriteRefs(value),
      ]),
  );
}

/**
 * Converts a zod schema for hono-openapi. Zod's own `toJSONSchema` is the
 * only converter that reads `.meta()` / `.describe()` metadata, but it keeps
 * named schemas in a root `$defs` block and marks the root with `id`, and
 * hono-openapi's default converter only hoists the `$defs` when the root is
 * itself a `$ref`. This hoists every named schema into `components.schemas`
 * so each `$ref` resolves and the spec carries no stray `$defs`, `id` or
 * `$schema` keys.
 */
export const toOpenApiSchema: ToOpenApiSchema = (schema, context) => {
  const {
    $schema: _,
    $defs,
    id,
    ...root
  } = z.toJSONSchema(schema as z.ZodType, {
    io: "input",
    ...context.options,
  });

  const schemas = context.components.schemas ?? {};
  context.components.schemas = schemas;
  for (const [name, { id: _id, ...definition }] of Object.entries(
    $defs ?? {},
  )) {
    schemas[name] = rewriteRefs(definition) as OpenApiSchema;
  }

  const body = rewriteRefs(root) as OpenApiSchema;
  if (typeof id === "string") {
    schemas[id] = body;
    return { $ref: `${COMPONENTS_PREFIX}${id}` } as OpenApiSchema;
  }
  return body;
};
