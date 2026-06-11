import { PDFParse } from "pdf-parse";
import type { ParsedInvoice } from "./ourocard";
import { parseOurocardTxt } from "./ourocard";
import { parseItauPdf } from "./itau";
import { parseSantanderPdf } from "./santander";

export type { ParsedInvoice } from "./ourocard";
export type { ParsedTransaction } from "./ourocard";

type Bank = "bb" | "itau" | "santander";

function detectBank(text: string): Bank | null {
  const t = text.toLowerCase();
  if (t.includes("banco do brasil") || t.includes("ourocard") || t.includes("nr.cart")) return "bb";
  if (t.includes("itaú unibanco") || t.includes("itaú") || t.includes("itau")) return "itau";
  if (t.includes("santander")) return "santander";
  return null;
}

export async function parseInvoiceFile(
  buffer: ArrayBuffer,
  fileName: string
): Promise<ParsedInvoice> {
  const isPdf = fileName.toLowerCase().endsWith(".pdf");

  let text: string;

  if (isPdf) {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    text = result.text;
    await parser.destroy();
  } else {
    text = new TextDecoder("windows-1252").decode(buffer);
  }

  const bank = detectBank(text);

  if (bank === "bb") return parseOurocardTxt(text);
  if (bank === "itau") return parseItauPdf(text);
  if (bank === "santander") return parseSantanderPdf(text);

  if (!isPdf) return parseOurocardTxt(text);

  throw new Error(
    "Banco não reconhecido no arquivo PDF. Verifique se o arquivo é do Itaú ou Santander. " +
    "Se for de outro banco, entre em contato com o administrador."
  );
}
