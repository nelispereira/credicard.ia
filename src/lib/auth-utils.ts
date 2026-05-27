import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "nelisnnp@gmail.com";

export function isAdmin(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL;
}

export async function getPersonByUserEmail(email: string | null | undefined) {
  if (!email) return null;
  return prisma.person.findFirst({
    where: { email: { equals: email.toLowerCase(), mode: "insensitive" } },
    select: { id: true, nome: true },
  });
}

export async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    throw new Error("Acesso negado");
  }
}
