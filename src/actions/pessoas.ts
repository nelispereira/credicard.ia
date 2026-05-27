"use server";

import { prisma } from "@/lib/prisma";
import { pessoaSchema } from "@/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";

export type ActionState = { error: string } | null;

function rawPessoa(formData: FormData) {
  return {
    nome: formData.get("nome") as string,
    cpf: (formData.get("cpf") as string).replace(/\D/g, ""),
    email: (formData.get("email") as string) || undefined,
    telefone: (formData.get("telefone") as string) || undefined,
  };
}

export async function createPessoa(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = pessoaSchema.safeParse(rawPessoa(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.person.create({ data: parsed.data });
  } catch {
    return { error: "CPF já cadastrado." };
  }

  revalidatePath("/pessoas");
  redirect("/pessoas");
}

export async function updatePessoa(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = parseInt(formData.get("id") as string);
  const parsed = pessoaSchema.safeParse(rawPessoa(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.person.update({ where: { id }, data: parsed.data });
  } catch {
    return { error: "CPF já cadastrado em outro registro." };
  }

  revalidatePath("/pessoas");
  redirect("/pessoas");
}

export async function deletePessoa(formData: FormData) {
  await requireAdmin();
  const id = parseInt(formData.get("id") as string);

  const [usages, transactions] = await Promise.all([
    prisma.cardUsage.count({ where: { personId: id } }),
    prisma.invoiceTransaction.count({ where: { personId: id } }),
  ]);

  if (usages + transactions > 0) {
    redirect("/pessoas?erro=em-uso");
  }

  await prisma.person.delete({ where: { id } });
  revalidatePath("/pessoas");
  redirect("/pessoas");
}
