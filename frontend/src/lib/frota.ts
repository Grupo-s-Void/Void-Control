/** Ligações entre motoristas e notas. */
import { OFFLINE_MIN } from "./config";
import type { NotaFiscal, Usuario } from "./tipos";
import { atrasada } from "./util";

export const offline = (u: Usuario) => !u.local || Date.now() - new Date(u.local.em).getTime() > OFFLINE_MIN * 60000;
export const notasDe = (id: string, notas: NotaFiscal[]) => notas.filter((n) => n.motoristaId === id);
export const abertasDe = (id: string, notas: NotaFiscal[]) => notasDe(id, notas).filter((n) => n.status !== "conferido");
export const atrasadasDe = (id: string, notas: NotaFiscal[]) => notasDe(id, notas).filter(atrasada);

/** % das notas do motorista que já estão conferidas (0–100). */
export function progressoDe(id: string, notas: NotaFiscal[]) {
  const todas = notasDe(id, notas);
  if (!todas.length) return 0;
  return Math.round((todas.filter((n) => n.status === "conferido").length / todas.length) * 100);
}

/** Online primeiro (mais recente no topo), sem sinal por último. */
export const ordenarMotoristas = (ms: Usuario[]) =>
  [...ms].sort((a, b) => Number(offline(a)) - Number(offline(b)) || (b.local?.em ?? "").localeCompare(a.local?.em ?? ""));
