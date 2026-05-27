import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCartao } from "@/actions/cartoes";
import { CartaoForm } from "../_components/CartaoForm";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/auth-utils";

export default async function EditarCartaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/minha-conta");

  const { id } = await params;
  const cartao = await prisma.creditCard.findUnique({ where: { id: parseInt(id) } });
  if (!cartao) notFound();

  return (
    <div>
      <div className="mb-6">
        <a href="/cartoes" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          ← Cartões
        </a>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mt-2">Editar cartão</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <CartaoForm
          action={updateCartao}
          defaultValues={{
            id: cartao.id,
            nome: cartao.nome,
            ultimos4: cartao.ultimos4,
          }}
        />
      </div>
    </div>
  );
}
