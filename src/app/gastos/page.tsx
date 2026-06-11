import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  listarCategorias,
  listarGastos,
  calcularResumoMensal,
  calcularResumoUltimosMeses,
} from "@/actions/gastos";
import { CategoriasSection } from "./_components/CategoriasSection";
import { GastosList } from "./_components/GastosList";
import { GastosChart } from "./_components/GastosChart";
import { ResumoGastos } from "@/app/_components/ResumoGastos";

export default async function GastosPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: session.user.email }, select: { bloqueado: true } });
  if (dbUser?.bloqueado) redirect("/login");

  const agora = new Date();
  const mesAtual = agora.getMonth() + 1;
  const anoAtual = agora.getFullYear();

  const [categorias, gastos, resumoMensal, historico] = await Promise.all([
    listarCategorias(),
    listarGastos(),
    calcularResumoMensal(mesAtual, anoAtual),
    calcularResumoUltimosMeses(6, 3),
  ]);

  return (
    <div className="space-y-8 mt-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">
          Meus Gastos
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Gerencie seus gastos mensais, recorrentes e parcelados.
        </p>
      </div>

      {/* Gráfico histórico + resumo mensal lado a lado em telas grandes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GastosChart meses={historico} />
        <ResumoGastos
          initialData={resumoMensal}
          initialMes={mesAtual}
          initialAno={anoAtual}
        />
      </div>

      {/* Categorias */}
      <CategoriasSection categorias={categorias} />

      {/* Gastos cadastrados */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Gastos cadastrados
        </h2>
        <GastosList gastos={gastos} categorias={categorias} />
      </section>
    </div>
  );
}
