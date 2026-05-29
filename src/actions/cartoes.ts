"use server";

import { prisma } from "@/lib/prisma";
import { cartaoSchema } from "@/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";

export type ActionState = { error: string } | null;

export async function createCartao(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = cartaoSchema.safeParse({
    nome: formData.get("nome"),
    ultimos4: formData.get("ultimos4"),
    diaVencimento: formData.get("diaVencimento"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.creditCard.create({ data: parsed.data });
  } catch {
    return { error: "Já existe um cartão com esse nome e últimos 4 dígitos." };
  }

  revalidatePath("/cartoes");
  redirect("/cartoes");
}

export async function updateCartao(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = parseInt(formData.get("id") as string);
  const parsed = cartaoSchema.safeParse({
    nome: formData.get("nome"),
    ultimos4: formData.get("ultimos4"),
    diaVencimento: formData.get("diaVencimento"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.creditCard.update({ where: { id }, data: parsed.data });
  } catch {
    return { error: "Já existe um cartão com esse nome e últimos 4 dígitos." };
  }

  revalidatePath("/cartoes");
  redirect("/cartoes");
}

export async function deleteCartao(formData: FormData) {
  await requireAdmin();
  const id = parseInt(formData.get("id") as string);

  const [usages, invoices] = await Promise.all([
    prisma.cardUsage.count({ where: { creditCardId: id } }),
    prisma.invoice.count({ where: { creditCardId: id } }),
  ]);

  if (usages + invoices > 0) {
    redirect("/cartoes?erro=em-uso");
  }

  await prisma.creditCard.delete({ where: { id } });
  revalidatePath("/cartoes");
  redirect("/cartoes");
}
