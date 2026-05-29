export interface ParsedTransaction {
  data: Date;
  descricao: string;
  pais: string;
  valorBRL: number;
  valorUSD: number;
}

export interface ParsedInvoice {
  titular: string;
  ultimos4: string;
  modalidade: string;
  vencimento: Date;
  totalBRL: number;
  transactions: ParsedTransaction[];
}

const DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})/;
const TRANSACTION_RE =
  /^(\d{2}\.\d{2}\.\d{4})(.+?)\s*(BR|US)\s+([\d.,]+)\s+([\d.,]+)/;
const TX_FALLBACK_RE =
  /^(\d{2}\.\d{2}\.\d{4})(.+?)\s+([\d.,]+)\s+([\d.,]+)\s*$/;
const CARD_NR_RE = /Nr\.Cart[^\s:]+\s*:\s*[\d.]+\.(\d{4})/i;
const CLIENT_RE = /Cliente\s*:\s*(.+)/i;
const MODALIDADE_RE = /Modalidade\s*:\s*(.+)/i;
const VENCIMENTO_RE = /Vencimento\s*:\s*(\d{2})\.(\d{2})\.(\d{4})/i;
const TOTAL_RE = /Total da fatura\s*:\s*R\$\s*([\d.,]+)/i;

function parseBRL(value: string): number {
  return parseFloat(value.replace(/\./g, "").replace(",", "."));
}

function parseDate(dd: string, mm: string, yyyy: string): Date {
  return new Date(
    Date.UTC(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd))
  );
}

export function parseOurocardTxt(content: string): ParsedInvoice {
  const lines = content.split(/\r?\n/);

  let titular = "";
  let ultimos4 = "";
  let modalidade = "";
  let vencimento = new Date();
  let totalBRL = 0;
  const transactions: ParsedTransaction[] = [];

  for (const line of lines) {
    const clientMatch = line.match(CLIENT_RE);
    if (clientMatch) { titular = clientMatch[1].trim(); continue; }

    const cardMatch = line.match(CARD_NR_RE);
    if (cardMatch) { ultimos4 = cardMatch[1]; continue; }

    const modalMatch = line.match(MODALIDADE_RE);
    if (modalMatch) { modalidade = modalMatch[1].trim(); continue; }

    const vencMatch = line.match(VENCIMENTO_RE);
    if (vencMatch) {
      vencimento = parseDate(vencMatch[1], vencMatch[2], vencMatch[3]);
      continue;
    }

    const totalMatch = line.match(TOTAL_RE);
    if (totalMatch) { totalBRL = parseBRL(totalMatch[1]); continue; }

    if (!DATE_RE.test(line)) continue;

    const txMatch = line.match(TRANSACTION_RE);
    if (txMatch) {
      const [, rawDate, rawDesc, pais, rawBRL, rawUSD] = txMatch;
      const [dd, mm, yyyy] = rawDate.split(".");
      transactions.push({
        data: parseDate(dd, mm, yyyy),
        descricao: rawDesc.trim(),
        pais,
        valorBRL: parseBRL(rawBRL),
        valorUSD: parseBRL(rawUSD),
      });
      continue;
    }

    const fallbackMatch = line.match(TX_FALLBACK_RE);
    if (!fallbackMatch) continue;

    const [, rawDate2, rawDesc2, rawBRL2, rawUSD2] = fallbackMatch;
    const [dd2, mm2, yyyy2] = rawDate2.split(".");
    transactions.push({
      data: parseDate(dd2, mm2, yyyy2),
      descricao: rawDesc2.trim(),
      pais: "BR",
      valorBRL: parseBRL(rawBRL2),
      valorUSD: parseBRL(rawUSD2),
    });
  }

  return { titular, ultimos4, modalidade, vencimento, totalBRL, transactions };
}
