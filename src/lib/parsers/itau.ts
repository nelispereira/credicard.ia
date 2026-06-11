import type { ParsedInvoice, ParsedTransaction } from "./ourocard";

function parseBRL(value: string): number {
  return parseFloat(value.replace(/\./g, "").replace(",", "."));
}

function parseDate(input: string): Date | null {
  const full = input.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (full) {
    return new Date(Date.UTC(parseInt(full[3]), parseInt(full[2]) - 1, parseInt(full[1])));
  }
  const short = input.match(/(\d{2})\/(\d{2})/);
  if (short) {
    const year = new Date().getFullYear();
    return new Date(Date.UTC(year, parseInt(short[2]) - 1, parseInt(short[1])));
  }
  return null;
}

const TITULAR_RES = [
  /titular[:\s]+([A-ZÀÁÂÃÉÊÍÓÔÕÚ\s]+)/i,
  /nome[:\s]+([A-ZÀÁÂÃÉÊÍÓÔÕÚ\s]{3,})/i,
  /cliente[:\s]+([A-ZÀÁÂÃÉÊÍÓÔÕÚ\s]+)/i,
  /portador[:\s]+([A-ZÀÁÂÃÉÊÍÓÔÕÚ\s]+)/i,
];

// Greedy .* before (\d{4}) captures the LAST 4 digits on the card line,
// handling formats like "4220.XXXX.XXXX.0744" or "****0744"
const CARD_RES = [
  /cart[aã]o[:\s].*(\d{4})/i,
  /n[uú]mero[:\s].*(\d{4})/i,
  /final\s+(\d{4})/i,
];

const VENCIMENTO_RES = [
  /vencimento[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
  /data\s+de\s+vencimento[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
  /vence\s+em[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
];

const TOTAL_RES = [
  /total\s+desta\s+fatura[:\s]+R?\$?\s*([\d.,]+)/i,
  /total\s+da\s+fatura[:\s]+R?\$?\s*([\d.,]+)/i,
  /valor\s+total[:\s]+R?\$?\s*([\d.,]+)/i,
  /total\s+a\s+pagar[:\s]+R?\$?\s*([\d.,]+)/i,
];

// Matches: DD/MM or DD/MM/YYYY  <spaces>  description  <spaces>  value (e.g. 357,41 or 1.173,28)
// Uses lazy .+? so the greedy value pattern anchors to the rightmost match.
// Value must start with a digit (excludes negative payment lines like -4.158,09).
const TX_RE = /^(\d{2}\/\d{2}(?:\/\d{4})?)\s+(.+?)\s+(\d[\d.]*,\d{2})\s*$/;

export function parseItauPdf(text: string): ParsedInvoice {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let titular = "";
  let ultimos4 = "";
  let vencimento: Date = new Date();
  let totalBRL = 0;
  const transactions: ParsedTransaction[] = [];

  for (const line of lines) {
    // Stop before "Compras parceladas" — those are future installment previews,
    // not charges for this billing period.
    if (/compras parceladas/i.test(line)) break;

    if (!titular) {
      for (const re of TITULAR_RES) {
        const m = line.match(re);
        if (m) { titular = m[1].trim(); break; }
      }
    }

    if (!ultimos4) {
      for (const re of CARD_RES) {
        const m = line.match(re);
        if (m) { ultimos4 = m[1]; break; }
      }
    }

    if (!totalBRL) {
      for (const re of TOTAL_RES) {
        const m = line.match(re);
        if (m) { totalBRL = parseBRL(m[1]); break; }
      }
    }

    for (const re of VENCIMENTO_RES) {
      const m = line.match(re);
      if (m) {
        const d = parseDate(m[1]);
        if (d) { vencimento = d; break; }
      }
    }

    const txMatch = line.match(TX_RE);
    if (!txMatch) continue;

    const rawDate = txMatch[1];
    const descricao = txMatch[2].trim();
    const valorBRL = parseBRL(txMatch[3]);

    if (valorBRL === 0) continue;
    // Skip payment lines (e.g. "PAGAMENTO PIX")
    if (/pagamento/i.test(descricao)) continue;

    const data = parseDate(rawDate);
    if (!data) continue;

    transactions.push({ data, descricao, pais: "BR", valorBRL, valorUSD: 0 });
  }

  return { titular, ultimos4, modalidade: "Itaú", vencimento, totalBRL, transactions };
}
