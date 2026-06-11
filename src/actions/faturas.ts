"use server";

import { prisma } from "@/lib/prisma";
import { parseInvoiceFile } from "@/lib/parsers";
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
  const mesAno = formData.get("mesAno") as string; // formato YYYY-MM

  if (!arquivo || arquivo.size === 0) {
    return { error: "Selecione um arquivo .txt ou .pdf para importar." };
  }
  if (!creditCardId) {
    return { error: "Selecione o cartão correspondente." };
  }
  if (!mesAno || !/^\d{4}-\d{2}$/.test(mesAno)) {
    return { error: "Informe o mês/ano da fatura." };
  }

  const buffer = await arquivo.arrayBuffer();

  let parsed;
  try {
    parsed = await parseInvoiceFile(buffer, arquivo.name);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Não foi possível ler o arquivo.";
    return { error: msg };
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

  // Deduplicar: remover fatura existente para o mesmo cartão e mês/ano
  const [yyyy, mm] = mesAno.split("-").map(Number);
  const inicioMes = new Date(Date.UTC(yyyy, mm - 1, 1));
  const inicioProximoMes = new Date(Date.UTC(yyyy, mm, 1));

  const faturaExistente = await prisma.invoice.findFirst({
    where: {
      creditCardId,
      periodoInicio: { gte: inicioMes, lt: inicioProximoMes },
    },
  });
  if (faturaExistente) {
    await prisma.invoiceTransaction.deleteMany({ where: { invoiceId: faturaExistente.id } });
    await prisma.invoice.delete({ where: { id: faturaExistente.id } });
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
      vencimento: parsed.vencimento ?? null,
    },
  });

  const descriptionRules = await prisma.descriptionRule.findMany({
    where: { creditCardId },
  });

  let lastPersonId: number | null = null;

  for (const tx of parsed.transactions) {
    const isIof = /^IOF\b/i.test(tx.descricao);

    const matchingRule = !isIof
      ? descriptionRules.find((r) =>
          tx.descricao.toLowerCase().includes(r.palavra.toLowerCase())
        )
      : undefined;

    let personId: number | null;

    if (matchingRule) {
      personId = matchingRule.personId;
    } else {
      const dayStart = new Date(tx.data.getTime());
      const dayEnd = new Date(tx.data.getTime() + 86_400_000 - 1);

      const usage = await prisma.cardUsage.findFirst({
        where: {
          creditCardId,
          data: { gte: dayStart, lte: dayEnd },
        },
      });

      personId = usage?.personId ?? (isIof ? lastPersonId : null);
    }

    await prisma.invoiceTransaction.create({
      data: {
        invoiceId: invoice.id,
        data: tx.data,
        descricao: tx.descricao,
        valorBRL: tx.valorBRL,
        valorUSD: tx.valorUSD,
        pais: tx.pais,
        personId,
        atribuidoManualmente: false,
      },
    });

    if (!isIof) {
      lastPersonId = personId;
    }
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

  const tx = await prisma.invoiceTransaction.findUnique({
    where: { id: transactionId },
    include: { invoice: { select: { creditCardId: true } } },
  });

  await prisma.invoiceTransaction.update({
    where: { id: transactionId },
    data: { personId, atribuidoManualmente: true },
  });

  // PARC NN/NN: criar CardUsage para que importações futuras reconheçam automaticamente
  if (tx && /PARC\s+\d+\/\d+/i.test(tx.descricao)) {
    await prisma.cardUsage.createMany({
      data: [{ personId, creditCardId: tx.invoice.creditCardId, data: tx.data }],
      skipDuplicates: true,
    });
  }

  // Auto-atribuir outras transações não atribuídas do mesmo dia na mesma fatura
  if (tx) {
    const dayStart = new Date(tx.data.getTime());
    const dayEnd = new Date(tx.data.getTime() + 86_400_000 - 1);

    await prisma.invoiceTransaction.updateMany({
      where: {
        invoiceId,
        personId: null,
        id: { not: transactionId },
        data: { gte: dayStart, lte: dayEnd },
      },
      data: { personId, atribuidoManualmente: false },
    });
  }

  revalidatePath(`/faturas/${invoiceId}`);
  redirect(`/faturas/${invoiceId}`);
}
