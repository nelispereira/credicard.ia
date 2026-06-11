import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { calcularResumoMensal } from "@/actions/gastos";
import { ResumoGastos } from "./_components/ResumoGastos";

const cards = [
  {
    href: "/pessoas",
    title: "Pessoas",
    desc: "Cadastre as pessoas que usam os cartões",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "/cartoes",
    title: "Cartões",
    desc: "Gerencie os cartões de crédito compartilhados",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    href: "/usos",
    title: "Registrar Uso",
    desc: "Informe quem usou qual cartão em cada dia",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/faturas",
    title: "Faturas",
    desc: "Importe o TXT da fatura e veja o rateio por pessoa",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: "/gastos",
    title: "Gastos",
    desc: "Controle seus gastos mensais, recorrentes e parcelados",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default async function Home() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/minha-conta");
  const adminEmail = session?.user?.email ?? "";

  const now = new Date();
  const mes = now.getMonth() + 1;
  const ano = now.getFullYear();

  const [allUsers, pessoas, resumo] = await Promise.all([
    prisma.user.findMany({
      where: { email: { not: adminEmail } },
      select: { email: true },
    }),
    prisma.person.findMany({ select: { email: true } }),
    calcularResumoMensal(mes, ano),
  ]);

  const pessoaEmails = new Set(
    pessoas.map((p) => p.email?.toLowerCase()).filter(Boolean) as string[]
  );
  const pendentes = allUsers.filter(
    (u) => !pessoaEmails.has(u.email.toLowerCase())
  ).length;

  return (
    <div className="mt-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">
          Credicard.ia
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Controle de uso e rateio de faturas de cartões de crédito compartilhados.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(({ href, title, desc, icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-4 p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
          >
            <div className="shrink-0 p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors">
              {icon}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">{title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
            </div>
          </Link>
        ))}

        <Link
          href="/usuarios"
          className="group flex items-start gap-4 p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
        >
          <div className="shrink-0 p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Usuários</h2>
              {pendentes > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  {pendentes}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {pendentes > 0
                ? `${pendentes} usuário${pendentes > 1 ? "s" : ""} aguardando aprovação`
                : "Gerencie quem pode acessar o sistema"}
            </p>
          </div>
        </Link>
      </div>

      {/* Resumo de gastos do mês */}
      <div className="mt-6">
        <ResumoGastos initialData={resumo} initialMes={mes} initialAno={ano} />
      </div>
    </div>
  );
}
