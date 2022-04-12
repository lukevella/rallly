export const preventWidows = (text: string) => {
  // This only really makes sense if we have at least 3 words
  if (text.split(" ").length < 3) {
    return text;
  }
  const index = text.lastIndexOf(" ");
  return [text.substring(0, index), text.substring(index + 1)].join("\u00a0");
};
