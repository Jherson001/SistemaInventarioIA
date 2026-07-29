/**
 * CSV compatible con Excel (Latam): BOM UTF-8 + separador ;
 */
function escapeCell(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Escapar comillas y forzar comillas si hay ; , saltos o "
  if (/[;"\n\r,]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(headers, rows, { separator = ";" } = {}) {
  const head = headers.map((h) => escapeCell(h.label ?? h)).join(separator);
  const body = rows.map((row) =>
    headers
      .map((h) => {
        const key = h.key ?? h;
        const raw = typeof h.value === "function" ? h.value(row) : row[key];
        return escapeCell(raw);
      })
      .join(separator)
  );
  return [head, ...body].join("\r\n");
}

export function downloadCsv(filename, headers, rows, options) {
  const csv = toCsv(headers, rows, options);
  // BOM para que Excel abra acentos bien
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
