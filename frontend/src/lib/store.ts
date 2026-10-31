/**
 * Estado do app guardado no navegador (localStorage).
 * Para ligar num backend, troque só as funções deste arquivo.
 */
import { useSyncExternalStore } from "react";
import { NOTAS_SEED, USUARIOS_SEED } from "../data/seed";
import type { NotaFiscal, Usuario } from "./tipos";

type Estado = { usuarios: Usuario[]; notas: NotaFiscal[]; sessao: string | null };

/** Mude a versão quando o formato dos dados mudar (dados antigos são ignorados). */
const CHAVE = "void-control:v3";

function carregar(): Estado {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) return JSON.parse(bruto);
  } catch { /* sem armazenamento disponível: começa com os dados de exemplo */ }
  return { usuarios: USUARIOS_SEED, notas: NOTAS_SEED, sessao: null };
}

let estado = carregar();
const ouvintes = new Set<() => void>();
export let erroArmazenamento = "";

function set(mudar: (e: Estado) => Estado) {
  estado = mudar(estado);
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
    erroArmazenamento = "";
  } catch {
    erroArmazenamento = "Armazenamento do navegador cheio — as últimas fotos não serão lembradas ao recarregar.";
  }
  ouvintes.forEach((f) => f());
}

export function useEstado() {
  return useSyncExternalStore(
    (f) => (ouvintes.add(f), () => ouvintes.delete(f)),
    () => estado,
  );
}

export function useUsuarioAtual() {
  const e = useEstado();
  return e.usuarios.find((u) => u.id === e.sessao && u.ativo) ?? null;
}

const id = () => Math.random().toString(36).slice(2, 10);
const agora = () => new Date().toISOString();

export const acoes = {
  entrar: (usuarioId: string) => set((e) => ({ ...e, sessao: usuarioId })),
  sair: () => set((e) => ({ ...e, sessao: null })),
  restaurarDemo: () => set(() => ({ usuarios: USUARIOS_SEED, notas: NOTAS_SEED, sessao: estado.sessao })),

  salvarUsuario: (u: Omit<Usuario, "id"> & { id?: string }) =>
    set((e) => ({
      ...e,
      usuarios: u.id
        ? e.usuarios.map((x) => (x.id === u.id ? ({ ...x, ...u } as Usuario) : x))
        : [...e.usuarios, { ...u, id: id() } as Usuario],
    })),

  salvarNota: (n: Omit<NotaFiscal, "id"> & { id?: string }) =>
    set((e) => ({
      ...e,
      notas: n.id
        ? e.notas.map((x) => (x.id === n.id ? ({ ...x, ...n } as NotaFiscal) : x))
        : [{ ...n, id: id() } as NotaFiscal, ...e.notas],
    })),

  atribuir: (notaIds: string[], motoristaId: string | null) =>
    set((e) => ({ ...e, notas: e.notas.map((n) => (notaIds.includes(n.id) ? { ...n, motoristaId } : n)) })),

  enviarCanhoto: (notaId: string, foto: string, recebedor: string, por: string, local?: { lat: number; lng: number }) =>
    set((e) => ({
      ...e,
      notas: e.notas.map((n) =>
        n.id === notaId
          ? { ...n, status: "enviado", conferencia: undefined, canhoto: { foto, recebedor, enviadoPor: por, enviadoEm: agora(), local } }
          : n,
      ),
    })),

  conferir: (notaId: string, aprovado: boolean, por: string, motivo?: string) =>
    set((e) => ({
      ...e,
      notas: e.notas.map((n) =>
        n.id === notaId ? { ...n, status: aprovado ? "conferido" : "recusado", conferencia: { por, em: agora(), motivo } } : n,
      ),
    })),

  atualizarLocal: (usuarioId: string, lat: number, lng: number) =>
    set((e) => ({
      ...e,
      usuarios: e.usuarios.map((u) =>
        u.id === usuarioId ? { ...u, local: { lat, lng, cidade: u.local?.cidade ?? "", em: agora() } } : u,
      ),
    })),
};
