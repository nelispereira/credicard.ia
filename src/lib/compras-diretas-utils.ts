export function compraDiretaAplicaNoMes(
  compra: { dataInicio: Date; numeroParcelas: number; valorTotal: number },
  mes: number,
  ano: number
): { aplica: boolean; valorMensal: number } {
  const inicio = new Date(compra.dataInicio);
  const inicioMes = inicio.getUTCMonth() + 1;
  const inicioAno = inicio.getUTCFullYear();
  const mesRef = ano * 12 + mes;
  const mesInicio = inicioAno * 12 + inicioMes;
  const mesFim = mesInicio + compra.numeroParcelas - 1;

  if (mesRef < mesInicio || mesRef > mesFim) return { aplica: false, valorMensal: 0 };
  return { aplica: true, valorMensal: compra.valorTotal / compra.numeroParcelas };
}
