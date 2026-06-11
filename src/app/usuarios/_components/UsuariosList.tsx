"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AvatarModal } from "./AvatarModal";
import { AprovarForm } from "./AprovarForm";
import { alternarBloqueioUsuario } from "../actions";

type User = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bloqueado: boolean;
};

type Props = {
  users: User[];
  pessoaEmails: string[];
  aprovar?: string;
};

export function UsuariosList({ users, pessoaEmails, aprovar }: Props) {
  const [busca, setBusca] = useState("");
  const [pending, startTransition] = useTransition();

  const emailsSet = new Set(pessoaEmails);

  const filtrados = users.filter((u) => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return (
      (u.name ?? "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Buscar por nome ou e-mail..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {filtrados.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-600">
          {busca ? "Nenhum usuário encontrado." : "Nenhum usuário logou ainda."}
        </p>
      )}

      <div className="space-y-3">
        {filtrados.map((user) => {
          const vinculado = emailsSet.has(user.email.toLowerCase());
          const expandido = aprovar === user.id;

          return (
            <div
              key={user.id}
              className={`bg-white dark:bg-gray-900 rounded-xl border overflow-hidden ${
                user.bloqueado
                  ? "border-red-200 dark:border-red-800"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <div className="flex items-center gap-4 p-4">
                {user.image ? (
                  <AvatarModal src={user.image} alt={user.name ?? ""} name={user.name ?? ""} />
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

                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {user.bloqueado && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                      </svg>
                      Bloqueado
                    </span>
                  )}

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

                  <button
                    onClick={() => startTransition(() => alternarBloqueioUsuario(user.id))}
                    disabled={pending}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                      user.bloqueado
                        ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900"
                        : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900"
                    }`}
                  >
                    {user.bloqueado ? "Desbloquear" : "Bloquear"}
                  </button>
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
    </div>
  );
}
