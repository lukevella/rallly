// Spreadsheets evaluate a cell starting with one of these as a formula
// (CWE-1236). A leading apostrophe makes Excel, Sheets and LibreOffice treat
// the cell as text.
const formulaTrigger = /^[=+\-@\t\r]/;

function encodeField(value: string) {
  const safe = formulaTrigger.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/**
 * Serializes rows to RFC 4180 CSV. Every field is treated as text, so this is
 * only for exports meant to be opened in a spreadsheet, not round-tripped.
 */
export function toCsv(rows: string[][]) {
  return rows.map((row) => row.map(encodeField).join(",")).join("\r\n");
}
