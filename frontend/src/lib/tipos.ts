import type { Nivel, Permissao } from "./acesso";

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  nivel: Nivel;
  permissoes: Permissao[];
  ativo: boolean;
  /** Só motoristas: última posição enviada pelo celular. */
  local?: { lat: number; lng: number; cidade: string; em: string };
  placa?: string;
};

/**
 * pendente   → NF emitida, canhoto ainda não voltou
 * enviado    → motorista mandou a foto, aguardando conferência
 * conferido  → foto aprovada
 * recusado   → foto ilegível / errada, precisa reenviar
 */
export type StatusCanhoto = "pendente" | "enviado" | "conferido" | "recusado";

export type NotaFiscal = {
  id: string;
  numero: string;
  serie: string;
  cliente: string;
  cidade: string;
  valor: number;
  /** AAAA-MM-DD */
  emissao: string;
  motoristaId: string | null;
  status: StatusCanhoto;
  canhoto?: {
    foto: string;
    enviadoPor: string;
    enviadoEm: string;
    recebedor: string;
    local?: { lat: number; lng: number };
  };
  conferencia?: { por: string; em: string; motivo?: string };
  observacao: string;
};
