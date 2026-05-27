import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { AprovarForm } from "./_components/AprovarForm";

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ aprovar?: string }>;
}) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/minha-conta");
  const adminEmail = session?.user?.email ?? "";

  const { aprovar } = await searchParams;

  const [users, pessoas] = await Promise.all([
    prisma.user.findMany({
      where: { email: { not: adminEmail } },
      orderBy: { name: "asc" },
    }),
    prisma.person.findMany({ select: { email: true } }),
  ]);

  const pessoaEmails = new Set(
    pessoas.map((p) => p.email?.toLowerCase()).filter(Boolean) as string[]
  );

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6">Usuários</h1>

      {users.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-600">
          Nenhum usuário logou ainda.
        </p>
      )}

      {users.length > 0 && (
        <div className="space-y-3">
          {users.map((user) => {
            const vinculado = pessoaEmails.has(user.email.toLowerCase());
            const expandido = aprovar === user.id;

            return (
              <div
                key={user.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
              >
                <div className="flex items-center gap-4 p-4">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name ?? ""}
                      width={40}
                      height={40}
                      className="rounded-full shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user.name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {vinculado ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Vinculado
                      </span>
                    ) : (
                      <Link
                        href={expandido ? "/usuarios" : `/usuarios?aprovar=${user.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                      >
                        {expandido ? "Cancelar" : "Aprovar"}
                      </Link>
                    )}
                  </div>
                </div>

                {expandido && !vinculado && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-5">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Preencha o CPF para cadastrar{" "}
                      <span className="font-semibold">{user.name}</span> como pessoa no sistema.
                    </p>
                    <AprovarForm nome={user.name ?? ""} email={user.email} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
