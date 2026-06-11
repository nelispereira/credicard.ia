"use server";

import { prisma } from "@/lib/prisma";
import { pessoaSchema } from "@/schemas";
import { requireAdmin } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActionState = { error: string } | null;

export async function aprovarUsuario(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const nome = formData.get("nome") as string;
  const email = (formData.get("email") as string) || undefined;
  const cpf = (formData.get("cpf") as string).replace(/\D/g, "");
  const telefone = (formData.get("telefone") as string) || undefined;

  const parsed = pessoaSchema.safeParse({ nome, cpf, email, telefone });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.person.create({ data: parsed.data });
  } catch {
    return { error: "CPF já cadastrado." };
  }

  revalidatePath("/usuarios");
  revalidatePath("/pessoas");
  redirect("/usuarios");
}

export async function alternarBloqueioUsuario(userId: string): Promise<void> {
  await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { bloqueado: true } });
  if (!user) return;

  await prisma.user.update({
    where: { id: userId },
    data: { bloqueado: !user.bloqueado },
  });

  revalidatePath("/usuarios");
}
