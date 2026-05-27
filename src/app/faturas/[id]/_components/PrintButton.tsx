"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
    >
      Imprimir / Salvar PDF
    </button>
  );
}
