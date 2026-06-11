import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAdmin, getPersonByUserEmail } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { calcularResumoMensal } from "@/actions/gastos";
import { ResumoGastos } from "@/app/_components/ResumoGastos";

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function MinhaContaPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) redirect("/login");
  if (isAdmin(email)) redirect("/");

  const dbUser = await prisma.user.findUnique({ where: { email }, select: { id: true, bloqueado: true } });
  if (dbUser?.bloqueado) redirect("/login");

  const now = new Date();
  const mes = now.getMonth() + 1;
  const ano = now.getFullYear();

  const [person, resumo] = await Promise.all([
    getPersonByUserEmail(email),
    calcularResumoMensal(mes, ano),
  ]);

  // Buscar faturas de cartões compartilhados com este usuário
  const sharedInvoices = dbUser
    ? await prisma.invoice.findMany({
        where: {
          creditCard: {
            shares: { some: { userId: dbUser.id } },
          },
        },
        include: {
          creditCard: { select: { nome: true, ultimos4: true } },
          transactions: {
            include: { person: { select: { nome: true } } },
            orderBy: { data: "asc" },
          },
        },
        orderBy: { periodoFim: "desc" },
      })
    : [];

  if (!person && sharedInvoices.length === 0) {
    return (
      <div className="space-y-6 mt-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          Minha Conta
        </h1>
        <div className="bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center">
          <p className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
            Conta ainda não vinculada
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            Seu e-mail{" "}
            <span className="font-mono bg-yellow-100 dark:bg-yellow-900/50 px-1 rounded">
              {email}
            </span>{" "}
            ainda não foi associado a uma pessoa no sistema. Aguarde o
            administrador vincular seu e-mail.
          </p>
        </div>
        <ResumoGastos initialData={resumo} initialMes={mes} initialAno={ano} />
      </div>
    );
  }

  // Transações pessoais
  const transactions = person
    ? await prisma.invoiceTransaction.findMany({
        where: { personId: person.id },
        include: {
          invoice: {
            include: {
              creditCard: { select: { nome: true, ultimos4: true } },
            },
          },
        },
        orderBy: { data: "asc" },
      })
    : [];

  // Agrupar transações pessoais por fatura
  const byInvoice = new Map<
    number,
    {
      invoice: (typeof transactions)[0]["invoice"];
      txs: typeof transactions;
    }
  >();

  for (const tx of transactions) {
    if (!byInvoice.has(tx.invoiceId)) {
      byInvoice.set(tx.invoiceId, { invoice: tx.invoice, txs: [] });
    }
    byInvoice.get(tx.invoiceId)!.txs.push(tx);
  }

  const invoiceGroups = Array.from(byInvoice.values()).sort(
    (a, b) =>
      b.invoice.periodoFim.getTime() - a.invoice.periodoFim.getTime()
  );

  const grandTotal = transactions.reduce((s, t) => s + t.valorBRL, 0);

  return (
    <div className="space-y-6 mt-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">
          {person ? `Olá, ${person.nome}` : "Minha Conta"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Suas despesas em cartões compartilhados
        </p>
      </div>

      {/* Resumo de gastos mensais */}
      <ResumoGastos initialData={resumo} initialMes={mes} initialAno={ano} />

      {/* Transações pessoais */}
      {person && (
        <>
          {invoiceGroups.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-600">
              Nenhuma transação encontrada até o momento.
            </p>
          ) : (
            <>
              {invoiceGroups.map(({ invoice, txs }) => {
                const subtotal = txs.reduce((s, t) => s + t.valorBRL, 0);
                return (
                  <div
                    key={invoice.id}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {invoice.creditCard.nome}{" "}
                          <span className="font-mono text-sm font-normal text-gray-500 dark:text-gray-400">
                            •••{invoice.creditCard.ultimos4}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {formatDate(invoice.periodoInicio)} a{" "}
                          {formatDate(invoice.periodoFim)}
                        </p>
                      </div>
                      <span className="font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                        {formatBRL(subtotal)}
                      </span>
                    </div>
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {txs.map((tx) => (
                          <tr
                            key={tx.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="px-4 py-2.5 tabular-nums text-gray-500 dark:text-gray-400 w-28">
                              {formatDate(tx.data)}
                            </td>
                            <td className="py-2.5 pr-4 text-gray-800 dark:text-gray-200">
                              {tx.descricao}
                            </td>
                            <td className="py-2.5 pr-4 text-right tabular-nums font-medium text-gray-900 dark:text-gray-100">
                              {formatBRL(tx.valorBRL)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}

              <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3 flex justify-between items-center">
                <span className="font-semibold text-indigo-800 dark:text-indigo-300">
                  Total geral
                </span>
                <span className="font-bold text-xl tabular-nums text-indigo-900 dark:text-indigo-200">
                  {formatBRL(grandTotal)}
                </span>
              </div>
            </>
          )}
        </>
      )}

      {/* Faturas compartilhadas */}
      {sharedInvoices.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pt-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Faturas compartilhadas
            </h2>
            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">
              Acesso completo
            </span>
          </div>

          {sharedInvoices.map((invoice) => {
            // Agrupar transações por pessoa
            const byPerson = new Map<
              string,
              { nome: string; txs: typeof invoice.transactions }
            >();

            for (const tx of invoice.transactions) {
              const key = tx.personId ? String(tx.personId) : "__none__";
              const nome = tx.person?.nome ?? "Não atribuído";
              if (!byPerson.has(key)) byPerson.set(key, { nome, txs: [] });
              byPerson.get(key)!.txs.push(tx);
            }

            const total = invoice.transactions.reduce((s, t) => s + t.valorBRL, 0);

            return (
              <div
                key={invoice.id}
                className="bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-800">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {invoice.creditCard.nome}{" "}
                      <span className="font-mono text-sm font-normal text-gray-500 dark:text-gray-400">
                        •••{invoice.creditCard.ultimos4}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatDate(invoice.periodoInicio)} a{" "}
                      {formatDate(invoice.periodoFim)}
                    </p>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                    {formatBRL(total)}
                  </span>
                </div>

                {Array.from(byPerson.entries()).map(([key, { nome, txs }]) => {
                  const subtotal = txs.reduce((s, t) => s + t.valorBRL, 0);
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                          {nome}
                        </span>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                          {formatBRL(subtotal)}
                        </span>
                      </div>
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {txs.map((tx) => (
                            <tr
                              key={tx.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <td className="px-4 py-2.5 tabular-nums text-gray-500 dark:text-gray-400 w-28">
                                {formatDate(tx.data)}
                              </td>
                              <td className="py-2.5 pr-4 text-gray-800 dark:text-gray-200">
                                {tx.descricao}
                              </td>
                              <td className="py-2.5 pr-4 text-right tabular-nums font-medium text-gray-900 dark:text-gray-100">
                                {formatBRL(tx.valorBRL)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
