/** Funções pequenas de formatação e utilidades sem React. */
import { DIAS_PARA_ATRASO } from "./config";
import type { NotaFiscal, StatusCanhoto } from "./tipos";

/** Rótulo e cor (variável do CSS) de cada status de canhoto. */
export const STATUS: Record<StatusCanhoto, { rotulo: string; cor: string }> = {
  pendente: { rotulo: "Pendente", cor: "var(--warn)" },
  enviado: { rotulo: "A conferir", cor: "var(--info)" },
  conferido: { rotulo: "Conferido", cor: "var(--ok)" },
  recusado: { rotulo: "Recusado", cor: "var(--bad)" },
};

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const fmtMoeda = (v: number) => moeda.format(v || 0);
export const fmtData = (iso: string) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");
export const fmtDataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export const hojeISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export const diasDesde = (iso: string) =>
  Math.floor((new Date(`${hojeISO()}T00:00`).getTime() - new Date(`${iso.slice(0, 10)}T00:00`).getTime()) / 86_400_000);

export const atrasada = (n: NotaFiscal) =>
  (n.status === "pendente" || n.status === "recusado") && diasDesde(n.emissao) > DIAS_PARA_ATRASO;

export function haQuanto(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `há ${h} h` : `há ${Math.round(h / 24)} d`;
}

export const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export const iniciais = (nome: string) =>
  nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

/** Reduz a foto do celular (máx. 1400px, JPEG) — 4 MB viram ~150 KB. */
export function comprimirImagem(arquivo: File, lado = 1400, qualidade = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!arquivo.type.startsWith("image/")) return reject(new Error("O arquivo precisa ser uma imagem."));
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, lado / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", qualidade));
    };
    img.onerror = () => (URL.revokeObjectURL(url), reject(new Error("Não foi possível ler a imagem.")));
    img.src = url;
  });
}

/** Baixa CSV com ";" (abre direto no Excel em português). */
export function exportarCSV(notas: NotaFiscal[], nomeMotorista: (id: string | null) => string) {
  const cel = (v: string | number) => {
    const t = String(v ?? "");
    return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const linhas = [
    ["NF", "Série", "Cliente", "Cidade", "Emissão", "Valor", "Motorista", "Status", "Atrasada", "Recebedor", "Enviado em"],
    ...notas.map((n) => [
      n.numero, n.serie, n.cliente, n.cidade, fmtData(n.emissao), n.valor.toFixed(2).replace(".", ","),
      nomeMotorista(n.motoristaId), STATUS[n.status].rotulo, atrasada(n) ? "Sim" : "Não",
      n.canhoto?.recebedor ?? "", n.canhoto ? fmtDataHora(n.canhoto.enviadoEm) : "",
    ]),
  ];
  const blob = new Blob(["﻿" + linhas.map((l) => l.map(cel).join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `canhotos-${hojeISO()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** "Qua, 21 de out." */
export const dataCurta = (d = new Date()) => {
  const s = d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "");
  const [sem, resto] = s.split(", ");
  return `${sem[0].toUpperCase()}${sem.slice(1)}, ${resto}.`;
};

/** Plural simples: plural(3, "canhoto") -> "3 canhotos". */
export const plural = (n: number, um: string, varios = `${um}s`) => `${n} ${n === 1 ? um : varios}`;

export const primeiroNome = (nome: string) => nome.split(" ")[0];
