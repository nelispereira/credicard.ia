"use server";

import { prisma } from "@/lib/prisma";
import { parseOurocardTxt } from "@/lib/parsers/ourocard";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";

export type ActionState = { error: string } | null;

export async function importarFatura(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const arquivo = formData.get("arquivo") as File | null;
  const creditCardId = parseInt(formData.get("creditCardId") as string);

  if (!arquivo || arquivo.size === 0) {
    return { error: "Selecione um arquivo .txt para importar." };
  }
  if (!creditCardId) {
    return { error: "Selecione o cartão correspondente." };
  }

  const buffer = await arquivo.arrayBuffer();
  const content = new TextDecoder("windows-1252").decode(buffer);

  let parsed;
  try {
    parsed = parseOurocardTxt(content);
  } catch {
    return { error: "Não foi possível ler o arquivo. Verifique o formato." };
  }

  if (parsed.transactions.length === 0) {
    return { error: "Nenhuma transação encontrada no arquivo." };
  }

  const card = await prisma.creditCard.findUnique({ where: { id: creditCardId } });
  if (!card) return { error: "Cartão não encontrado." };

  if (parsed.ultimos4 && parsed.ultimos4 !== card.ultimos4) {
    return {
      error: `O arquivo é do cartão final ${parsed.ultimos4}, mas o cartão selecionado termina em ${card.ultimos4}.`,
    };
  }

  const dates = parsed.transactions.map((t) => t.data.getTime());
  const periodoInicio = new Date(Math.min(...dates));
  const periodoFim = new Date(Math.max(...dates));

  const invoice = await prisma.invoice.create({
    data: {
      creditCardId,
      nomeArquivo: arquivo.name,
      periodoInicio,
      periodoFim,
    },
  });

  for (const tx of parsed.transactions) {
    const dayStart = new Date(tx.data.getTime());
    const dayEnd = new Date(tx.data.getTime() + 86_400_000 - 1);

    const usage = await prisma.cardUsage.findFirst({
      where: {
        creditCardId,
        data: { gte: dayStart, lte: dayEnd },
      },
    });

    await prisma.invoiceTransaction.create({
      data: {
        invoiceId: invoice.id,
        data: tx.data,
        descricao: tx.descricao,
        valorBRL: tx.valorBRL,
        valorUSD: tx.valorUSD,
        pais: tx.pais,
        personId: usage?.personId ?? null,
        atribuidoManualmente: false,
      },
    });
  }

  revalidatePath("/faturas");
  redirect(`/faturas/${invoice.id}`);
}

export async function deletarFatura(invoiceId: number): Promise<ActionState> {
  await requireAdmin();
  const exists = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!exists) return { error: "Fatura não encontrada." };

  await prisma.invoiceTransaction.deleteMany({ where: { invoiceId } });
  await prisma.invoice.delete({ where: { id: invoiceId } });

  revalidatePath("/faturas");
  redirect("/faturas");
}

export async function atribuirTransacao(formData: FormData) {
  await requireAdmin();
  const transactionId = parseInt(formData.get("transactionId") as string);
  const personId = parseInt(formData.get("personId") as string);
  const invoiceId = parseInt(formData.get("invoiceId") as string);

  await prisma.invoiceTransaction.update({
    where: { id: transactionId },
    data: { personId, atribuidoManualmente: true },
  });

  revalidatePath(`/faturas/${invoiceId}`);
  redirect(`/faturas/${invoiceId}`);
}
