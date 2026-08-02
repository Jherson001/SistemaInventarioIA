/**
 * CSV compatible con Excel (Latam): BOM UTF-8 + separador ;
 */
function escapeCell(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
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

function detectSeparator(headerLine) {
  const semis = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  return semis >= commas ? ";" : ",";
}

function splitCsvLine(line, separator) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === separator && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

function normalizeHeader(h) {
  const key = String(h || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase();
  const map = {
    sku: "sku",
    "codigo de barras": "barcode",
    "código de barras": "barcode",
    barcode: "barcode",
    codigo_barras: "barcode",
    producto: "name",
    nombre: "name",
    name: "name",
    descripcion: "description",
    descripción: "description",
    description: "description",
    costo: "cost",
    cost: "cost",
    precio: "price",
    price: "price",
    stock: "stock",
    "stock minimo": "min_stock",
    "stock mínimo": "min_stock",
    min_stock: "min_stock",
    activo: "is_active",
    is_active: "is_active",
  };
  return map[key] || key;
}

/** Parsea texto CSV (Excel Latam con ;) a array de objetos. */
export function parseCsv(text) {
  const cleaned = String(text || "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const lines = cleaned.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const separator = detectSeparator(lines[0]);
  const headers = splitCsvLine(lines[0], separator).map(normalizeHeader);

  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line, separator);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    return row;
  });
}

export function downloadProductImportTemplate() {
  downloadCsv(
    "plantilla_productos.csv",
    [
      { key: "sku", label: "SKU" },
      { key: "barcode", label: "Codigo de barras" },
      { key: "name", label: "Producto" },
      { key: "description", label: "Descripcion" },
      { key: "cost", label: "Costo" },
      { key: "price", label: "Precio" },
      { key: "stock", label: "Stock" },
      { key: "min_stock", label: "Stock minimo" },
      { key: "is_active", label: "Activo" },
    ],
    [
      {
        sku: "EJ-001",
        barcode: "",
        name: "Producto ejemplo",
        description: "",
        cost: "1.50",
        price: "2.50",
        stock: "10",
        min_stock: "2",
        is_active: "Si",
      },
    ]
  );
}
