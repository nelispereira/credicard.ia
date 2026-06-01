"use client";

import { useFormStatus } from "react-dom";

function ButtonInner({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 font-medium transition-colors"
    >
      {pending ? "…" : label}
    </button>
  );
}

export function DeleteButton({
  action,
  id,
  label = "Excluir",
}: {
  action: (formData: FormData) => Promise<void>;
  id: number;
  label?: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <ButtonInner label={label} />
    </form>
  );
}
