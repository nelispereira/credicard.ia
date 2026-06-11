import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCartao } from "@/actions/cartoes";
import { CartaoForm } from "../_components/CartaoForm";
import { auth } from "@/auth";
import { isAdmin, ADMIN_EMAIL } from "@/lib/auth-utils";
import { addCardShare, removeCardShare } from "@/actions/cardShares";

export default async function EditarCartaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/minha-conta");

  const { id } = await params;
  const creditCardId = parseInt(id);
  const cartao = await prisma.creditCard.findUnique({ where: { id: creditCardId } });
  if (!cartao) notFound();

  const [shares, allUsers] = await Promise.all([
    prisma.cardShare.findMany({
      where: { creditCardId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { bloqueado: false, email: { not: ADMIN_EMAIL } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const sharedUserIds = new Set(shares.map((s) => s.userId));
  const availableUsers = allUsers.filter((u) => !sharedUserIds.has(u.id));

  return (
    <div>
      <div className="mb-6">
        <a href="/cartoes" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          ← Cartões
        </a>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mt-2">Editar cartão</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
        <CartaoForm
          action={updateCartao}
          defaultValues={{
            id: cartao.id,
            nome: cartao.nome,
            ultimos4: cartao.ultimos4,
            diaVencimento: cartao.diaVencimento,
          }}
        />
      </div>

      {/* Compartilhamento */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Compartilhamento de fatura
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Usuários compartilhados podem ver a fatura completa deste cartão em suas contas.
        </p>

        {shares.length > 0 ? (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800 mb-4">
            {shares.map((share) => (
              <li key={share.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {share.user.name ?? share.user.email}
                  </p>
                  {share.user.name && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{share.user.email}</p>
                  )}
                </div>
                <form action={removeCardShare}>
                  <input type="hidden" name="creditCardId" value={creditCardId} />
                  <input type="hidden" name="userId" value={share.userId} />
                  <button
                    type="submit"
                    className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium"
                  >
                    Remover
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-600 mb-4">
            Nenhum usuário compartilhado ainda.
          </p>
        )}

        {availableUsers.length > 0 && (
          <form action={addCardShare} className="flex gap-2">
            <input type="hidden" name="creditCardId" value={creditCardId} />
            <select
              name="userId"
              required
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecionar usuário…</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ? `${u.name} (${u.email})` : u.email}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Adicionar
            </button>
          </form>
        )}

        {availableUsers.length === 0 && shares.length > 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-600 mt-2">
            Todos os usuários já têm acesso a este cartão.
          </p>
        )}
      </div>
    </div>
  );
}
