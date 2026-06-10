import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listarCategorias, listarGastos, excluirCategoria } from "@/actions/gastos";
import { CategoriaForm } from "./_components/CategoriaForm";
import { GastosList } from "./_components/GastosList";

export default async function GastosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [categorias, gastos] = await Promise.all([
    listarCategorias(),
    listarGastos(),
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

      {/* Seção Categorias */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Categorias
        </h2>

        {/* Lista de categorias */}
        {categorias.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {categorias.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full text-sm"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.cor ?? "#6366f1" }}
                />
                <span className="text-gray-800 dark:text-gray-200">{cat.nome}</span>
                <form action={excluirCategoria}>
                  <input type="hidden" name="id" value={cat.id} />
                  <button
                    type="submit"
                    className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 ml-1 leading-none transition-colors"
                    title="Remover categoria"
                  >
                    ×
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        {/* Formulário nova categoria */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Nova categoria
          </p>
          <CategoriaForm />
        </div>
      </section>

      {/* Seção Gastos */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Gastos cadastrados
        </h2>
        <GastosList gastos={gastos} categorias={categorias} />
      </section>
    </div>
  );
}
