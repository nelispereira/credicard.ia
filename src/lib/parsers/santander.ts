import type { ParsedInvoice, ParsedTransaction } from "./ourocard";

// ──────────────────────────────────────────────────────────────────────────────
// Parser para faturas PDF do Santander.
// O texto é extraído pelo dispatcher (pdf-parse) antes de chegar aqui.
//
// Padrões baseados no layout padrão de faturas Santander, mas podem precisar
// de ajuste fino com amostras reais — edite as regex abaixo se necessário.
// ──────────────────────────────────────────────────────────────────────────────

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

// Padrões de cabeçalho — ajuste se o PDF do seu Santander tiver palavras diferentes
const TITULAR_RES = [
  /nome[:\s]+([A-ZÀÁÂÃÉÊÍÓÔÕÚ\s]{3,})/i,
  /titular[:\s]+([A-ZÀÁÂÃÉÊÍÓÔÕÚ\s]+)/i,
  /cliente[:\s]+([A-ZÀÁÂÃÉÊÍÓÔÕÚ\s]+)/i,
  /portador[:\s]+([A-ZÀÁÂÃÉÊÍÓÔÕÚ\s]+)/i,
];

const CARD_RES = [
  /cart[aã]o[:\s*]+[\d*\s]+(\d{4})/i,
  /n[uú]mero[:\s]+[\d*\s]+(\d{4})/i,
  /final\s+(\d{4})/i,
  /\*{4}\s*(\d{4})/,
];

const VENCIMENTO_RES = [
  /vencimento[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
  /data\s+de\s+vencimento[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
  /pagamento\s+at[eé][:\s]+(\d{2}\/\d{2}\/\d{4})/i,
];

const TOTAL_RES = [
  /total\s+a\s+pagar[:\s]+R?\$?\s*([\d.,]+)/i,
  /valor\s+total[:\s]+R?\$?\s*([\d.,]+)/i,
  /total\s+da\s+fatura[:\s]+R?\$?\s*([\d.,]+)/i,
  /total[:\s]+R?\$?\s*([\d.,]+)/i,
];

// Linha de transação Santander — formatos comuns:
// "05/06   NOME DO ESTABELECIMENTO    R$ 100,00"
// "05/06/2026   NOME    150,00"
const TX_RE =
  /^(\d{2}\/\d{2}(?:\/\d{4})?)\s{2,}(.+?)\s{2,}R?\$?\s*([\d.,]+)\s*$/;

// Santander às vezes usa crédito/débito com sinal
const TX_SIGNED_RE =
  /^(\d{2}\/\d{2}(?:\/\d{4})?)\s{2,}(.+?)\s{2,}([+-]?R?\$?\s*[\d.,]+)\s*$/;

function parseSignedBRL(raw: string): number {
  const negative = raw.includes("-");
  const cleaned = raw.replace(/[+\-R$\s]/g, "");
  const value = parseBRL(cleaned);
  return negative ? -value : value;
}

export function parseSantanderPdf(text: string): ParsedInvoice {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let titular = "";
  let ultimos4 = "";
  let vencimento: Date = new Date();
  let totalBRL = 0;
  const transactions: ParsedTransaction[] = [];

  for (const line of lines) {
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

    const txMatch = line.match(TX_SIGNED_RE) ?? line.match(TX_RE);
    if (txMatch) {
      const rawDate = txMatch[1];
      const descricao = txMatch[2].trim();
      const valorBRL = parseSignedBRL(txMatch[3]);

      // Ignorar créditos (pagamentos) e zero
      if (valorBRL <= 0) continue;

      const data = parseDate(rawDate);
      if (!data) continue;

      transactions.push({ data, descricao, pais: "BR", valorBRL, valorUSD: 0 });
    }
  }

  return { titular, ultimos4, modalidade: "Santander", vencimento, totalBRL, transactions };
}
