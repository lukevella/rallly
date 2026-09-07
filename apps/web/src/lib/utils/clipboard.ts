/**
 * Copies text that is still being fetched. Handing the pending promise to
 * `ClipboardItem` keeps the write inside the click's user activation; Safari
 * refuses a `writeText` issued after an `await`. Browsers without promise
 * backed items fall back to awaiting first, which they allow.
 */
export async function copyTextFromPromise(text: Promise<string>) {
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": text.then(
          (value) => new Blob([value], { type: "text/plain" }),
        ),
      }),
    ]);
    return;
  }
  await navigator.clipboard.writeText(await text);
}
