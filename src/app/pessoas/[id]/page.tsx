import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePessoa } from "@/actions/pessoas";
import { PessoaForm } from "../_components/PessoaForm";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/auth-utils";

export default async function EditarPessoaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/minha-conta");

  const { id } = await params;
  const pessoa = await prisma.person.findUnique({ where: { id: parseInt(id) } });
  if (!pessoa) notFound();

  return (
    <div>
      <div className="mb-6">
        <a href="/pessoas" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          ← Pessoas
        </a>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mt-2">Editar pessoa</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <PessoaForm
          action={updatePessoa}
          defaultValues={{
            id: pessoa.id,
            nome: pessoa.nome,
            cpf: pessoa.cpf,
            email: pessoa.email ?? undefined,
            telefone: pessoa.telefone ?? undefined,
          }}
        />
      </div>
    </div>
  );
}
