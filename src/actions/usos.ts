"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";

export type ActionState = { error: string } | null;

export async function createUso(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const personId = parseInt(formData.get("personId") as string);
  const creditCardId = parseInt(formData.get("creditCardId") as string);
  const dataStr = formData.get("data") as string;
  const descricao = (formData.get("descricao") as string) || undefined;

  if (!personId || !creditCardId || !dataStr) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  // Parse YYYY-MM-DD as UTC midnight to match invoice parser output
  const [yyyy, mm, dd] = dataStr.split("-").map(Number);
  const data = new Date(Date.UTC(yyyy, mm - 1, dd));

  try {
    await prisma.cardUsage.create({
      data: { personId, creditCardId, data, descricao },
    });
  } catch {
    return { error: "Já existe um registro de uso para esse cartão nessa data." };
  }

  revalidatePath("/usos");
  redirect("/usos");
}

export async function deleteUso(formData: FormData) {
  await requireAdmin();
  const id = parseInt(formData.get("id") as string);
  await prisma.cardUsage.delete({ where: { id } });
  revalidatePath("/usos");
  redirect("/usos");
}
