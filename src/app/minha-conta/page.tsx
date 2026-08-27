import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAdmin, getPersonByUserEmail } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { calcularResumoMensal } from "@/actions/gastos";
import { ResumoGastos } from "@/app/_components/ResumoGastos";
import { DebitosCartao } from "@/app/_components/DebitosCartao";

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
  const [transactions, comprasDiretas] = person
    ? await Promise.all([
        prisma.invoiceTransaction.findMany({
          where: { personId: person.id },
          include: {
            invoice: {
              include: {
                creditCard: { select: { nome: true, ultimos4: true } },
              },
            },
          },
          orderBy: { data: "asc" },
        }),
        prisma.compraDireta.findMany({ where: { personId: person.id } }),
      ])
    : [[], []];

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

      <DebitosCartao transactions={transactions} sharedInvoices={sharedInvoices} comprasDiretas={comprasDiretas} />
    </div>
  );
}
