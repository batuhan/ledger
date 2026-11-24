export const CURRENCIES = ["EUR", "TRY", "USD", "GBP", "CHF"] as const;
export type Currency = "EUR" | "TRY" | "USD" | "GBP" | "CHF";

export const COUNTRIES = ["NL", "TR", "US", "GB", "EU", "OTHER"] as const;
export type Country = "NL" | "TR" | "US" | "GB" | "EU" | "OTHER";

export const ENTITY_TYPES = ["personal", "bv", "ltd_tr", "sole_prop", "holding", "trust"] as const;
export type EntityType = "personal" | "bv" | "ltd_tr" | "sole_prop" | "holding" | "trust";

export const ACCOUNT_TYPES = [
  "checking",
  "savings",
  "credit_card",
  "brokerage",
  "cash",
  "loan",
  "virtual_pot",
] as const;

export const ENTRY_KINDS = [
  "expense",
  "income",
  "transfer",
  "fx_conversion",
  "card_payment",
  "inter_entity",
  "fee",
  "tax",
  "investment",
] as const;

export function slugify(input: string): string {
  const clean = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean === "" ? "item" : clean.slice(0, 80);
}

export function currencySymbol(currency: string): string {
  if (currency === "EUR") return "€";
  if (currency === "TRY") return "₺";
  if (currency === "USD") return "$";
  if (currency === "GBP") return "£";
  if (currency === "CHF") return "CHF ";
  return `${currency} `;
}

export function formatMinor(minor: number, currency: string): string {
  const neg = minor < 0;
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  const wholeStr = String(whole).replace(/\B(?=(?:\d{3})+(?!\d))/g, ",");
  const fracStr = frac < 10 ? `0${frac}` : String(frac);
  return `${neg ? "-" : ""}${currencySymbol(currency)}${wholeStr}.${fracStr}`;
}

export function formatSignedMinor(minor: number, currency: string): string {
  if (minor > 0) return `+${formatMinor(minor, currency)}`;
  return formatMinor(minor, currency);
}

export function formatRateMicros(micros: number): string {
  return (micros / 1_000_000).toFixed(4);
}

export function formatQtyMicros(micros: number): string {
  const value = micros / 1_000_000;
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

export function convertToBaseMinor(amountMinor: number, rateMicros: number): number {
  return Math.round((amountMinor * rateMicros) / 1_000_000);
}

export function parseDecimalToMinor(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s+/g, "");
  if (trimmed === "") return null;
  // Support both European/Turkish "1.234,56" and US/ISO "1,234.56" formats.
  let normalized = trimmed;
  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");
  if (lastComma > lastDot) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = normalized.replace(/,/g, "");
  }
  normalized = normalized.replace(/[^0-9.+-]/g, "");
  const num = Number(normalized);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 100);
}

export interface ParsedStatementRow {
  postedOn: string;
  description: string;
  merchantRaw: string;
  amountMinor: number;
  currency: string;
  entryKind: "expense" | "income" | "transfer" | "fee";
  installmentCount: number | null;
  confidenceBps: number;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const cols: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line.charAt(i);
    if (ch === "\"") {
      if (inQuotes && line.charAt(i + 1) === "\"") {
        cur += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cols.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  cols.push(cur.trim());
  return cols;
}

function normalizeIsoDate(raw: string): string {
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY (common in bunq, HSBC Turkey, Wise EU)
  const dmy = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (dmy) {
    const d0 = dmy[1] ?? "01";
    const m0 = dmy[2] ?? "01";
    const y0 = dmy[3] ?? "2026";
    const d = d0.length === 1 ? `0${d0}` : d0;
    const m = m0.length === 1 ? `0${m0}` : m0;
    return `${y0}-${m}-${d}`;
  }
  return new Date().toISOString().slice(0, 10);
}

function detectInstallmentCount(text: string): number | null {
  // Matches Turkish bank statement patterns like "2/6 TAKSIT", "3/9 Taksit", "Taksit 1/3".
  const m = text.match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*(?:taksit|inst)/i) ?? text.match(/(?:taksit|installment)\s*(\d{1,2})\s*\/\s*(\d{1,2})/i);
  if (!m) return null;
  const total = Number(m[2] ?? "0");
  return Number.isInteger(total) && total >= 2 && total <= 36 ? total : null;
}

/**
 * Parses bunq, Wise, HSBC Turkey, or generic CSV bank statements into structured proposals.
 */
export function parseStatementCsv(
  text: string,
  fallbackCurrency: string,
): { detectedInstitution: string; detectedCurrency: string; rows: ParsedStatementRow[] } {
  const rawLines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");
  if (rawLines.length < 2) {
    return { detectedInstitution: "unknown", detectedCurrency: fallbackCurrency, rows: [] };
  }
  const headerLine = rawLines[0] ?? "";
  const delimiter = headerLine.split(";").length > headerLine.split(",").length ? ";" : ",";
  const headers = splitCsvLine(headerLine, delimiter).map((h) => h.toLowerCase().replace(/^"|"$/g, ""));

  let detectedInstitution = "csv";
  if (headers.includes("transferwise id") || headers.includes("running balance")) {
    detectedInstitution = "Wise";
  } else if (headers.includes("counterparty") && headers.includes("account")) {
    detectedInstitution = "bunq";
  } else if (headers.some((h) => h.includes("taksit") || h.includes("islem") || h.includes("tutar"))) {
    detectedInstitution = "HSBC Turkey";
  }

  const findCol = (needles: string[]): number => {
    for (let i = 0; i < headers.length; i++) {
      const col = headers[i] ?? "";
      for (const n of needles) {
        if (col === n || col.includes(n)) return i;
      }
    }
    return -1;
  };

  const dateCol = findCol(["date", "tarih", "posted", "created"]);
  const amountCol = findCol(["amount", "tutar", "value"]);
  const currencyCol = findCol(["currency", "para birimi", "ccy"]);
  const merchantCol = findCol(["merchant", "counterparty", "name", "payee", "karsi"]);
  const descCol = findCol(["description", "aciklama", "memo", "reference", "detail"]);

  const rows: ParsedStatementRow[] = [];
  let detectedCurrency = fallbackCurrency;

  for (let i = 1; i < rawLines.length; i++) {
    const line = rawLines[i] ?? "";
    const cols = splitCsvLine(line, delimiter);
    if (cols.length < 2) continue;
    const rawAmount = amountCol >= 0 ? (cols[amountCol] ?? "") : (cols[cols.length - 1] ?? "");
    const amountMinor = parseDecimalToMinor(rawAmount);
    if (amountMinor === null || amountMinor === 0) continue;

    const postedOn = normalizeIsoDate(dateCol >= 0 ? (cols[dateCol] ?? "") : (cols[0] ?? ""));
    const merchant = merchantCol >= 0 ? (cols[merchantCol] ?? "") : "";
    const desc = descCol >= 0 ? (cols[descCol] ?? "") : (cols[1] ?? "");
    const combinedDesc = (desc !== "" ? desc : merchant) || "Imported transaction";
    const merchantRaw = merchant !== "" ? merchant : combinedDesc.slice(0, 80);

    const rowCurrencyRaw = currencyCol >= 0 ? (cols[currencyCol] ?? "").toUpperCase() : "";
    const currency =
      rowCurrencyRaw === "EUR" || rowCurrencyRaw === "TRY" || rowCurrencyRaw === "USD" || rowCurrencyRaw === "GBP" || rowCurrencyRaw === "CHF"
        ? rowCurrencyRaw
        : fallbackCurrency;
    detectedCurrency = currency;

    const lower = `${combinedDesc} ${merchantRaw}`.toLowerCase();
    let entryKind: "expense" | "income" | "transfer" | "fee" = amountMinor >= 0 ? "income" : "expense";
    if (lower.includes("fee") || lower.includes("komisyon")) {
      entryKind = "fee";
    } else if (lower.includes("transfer") || lower.includes("havale") || lower.includes("wise")) {
      entryKind = "transfer";
    }

    rows.push({
      postedOn,
      description: combinedDesc.slice(0, 240),
      merchantRaw: merchantRaw.slice(0, 120),
      amountMinor,
      currency,
      entryKind,
      installmentCount: detectInstallmentCount(combinedDesc),
      confidenceBps: 8800,
    });
  }

  return { detectedInstitution, detectedCurrency, rows };
}
