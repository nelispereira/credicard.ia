import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { editarGasto } from "@/actions/gastos";
import { listarCategorias } from "@/actions/gastos";
import { GastoFormRedirect } from "../../_components/GastoFormRedirect";

export default async function EditarGastoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const [gasto, categorias] = await Promise.all([
    prisma.gasto.findFirst({
      where: { id: parseInt(id), userId: session.user.id },
      include: { categoria: true },
    }),
    listarCategorias(),
  ]);

  if (!gasto) notFound();

  return (
    <div className="mt-4">
      <div className="mb-6">
        <a
          href="/gastos"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          ← Meus Gastos
        </a>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mt-2">
          Editar gasto
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <GastoFormRedirect
          action={editarGasto}
          categorias={categorias}
          defaultValues={{
            id: gasto.id,
            categoriaId: gasto.categoriaId,
            descricao: gasto.descricao,
            valorTotal: gasto.valorTotal,
            tipo: gasto.tipo as "UNICO" | "RECORRENTE" | "PARCELADO",
            dataInicio: gasto.dataInicio,
            dataFim: gasto.dataFim,
            numeroParcelas: gasto.numeroParcelas,
          }}
        />
      </div>
    </div>
  );
}
