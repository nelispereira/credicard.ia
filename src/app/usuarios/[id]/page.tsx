import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { isAdmin, getPersonByUserEmail } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { calcularResumoMensalAdmin, listarGastosDaCategoriaNoMesAdmin } from "@/actions/gastos";
import { DebitosCartao } from "@/app/_components/DebitosCartao";
import { ResumoGastos } from "@/app/_components/ResumoGastos";

export default async function InspecionarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/minha-conta");

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
  if (!user) notFound();

  const person = await getPersonByUserEmail(user.email);
  if (!person) redirect("/usuarios");

  const now = new Date();
  const mes = now.getMonth() + 1;
  const ano = now.getFullYear();

  const [transactions, sharedInvoices, resumo, comprasDiretas] = await Promise.all([
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
    prisma.invoice.findMany({
      where: {
        creditCard: {
          shares: { some: { userId: user.id } },
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
    }),
    calcularResumoMensalAdmin(user.id, mes, ano),
    prisma.compraDireta.findMany({ where: { personId: person.id } }),
  ]);

  return (
    <div className="space-y-6 mt-4">
      <div>
        <Link
          href="/usuarios"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Usuários
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">
          Gastos de {person.nome}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
      </div>

      <ResumoGastos
        initialData={resumo}
        initialMes={mes}
        initialAno={ano}
        carregarResumo={calcularResumoMensalAdmin.bind(null, user.id)}
        carregarDetalhes={listarGastosDaCategoriaNoMesAdmin.bind(null, user.id)}
      />

      <DebitosCartao transactions={transactions} sharedInvoices={sharedInvoices} comprasDiretas={comprasDiretas} />
    </div>
  );
}
