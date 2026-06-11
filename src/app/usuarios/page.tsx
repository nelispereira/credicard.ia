import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { UsuariosList } from "./_components/UsuariosList";

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ aprovar?: string }>;
}) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/minha-conta");
  const adminEmail = session?.user?.email ?? "";

  const { aprovar } = await searchParams;

  const [users, pessoas] = await Promise.all([
    prisma.user.findMany({
      where: { email: { not: adminEmail } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, image: true, bloqueado: true },
    }),
    prisma.person.findMany({ select: { email: true } }),
  ]);

  const pessoaEmails = pessoas
    .map((p) => p.email?.toLowerCase())
    .filter(Boolean) as string[];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6">Usuários</h1>
      <UsuariosList users={users} pessoaEmails={pessoaEmails} aprovar={aprovar} />
    </div>
  );
}
