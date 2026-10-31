/**
 * DADOS FICTÍCIOS para testar o sistema.
 * Quando o backend existir, substitua por chamadas à API — o resto do app
 * só conhece os tipos de lib/tipos.ts.
 */
import { PADRAO_POR_NIVEL } from "../lib/acesso";
import type { NotaFiscal, StatusCanhoto, Usuario } from "../lib/tipos";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = rng(4513);
const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];

export const CIDADES: Record<string, [number, number]> = {
  "Joaçaba": [-27.178, -51.505], "Videira": [-27.008, -51.152], "Chapecó": [-27.1, -52.615],
  "Concórdia": [-27.234, -52.028], "Caçador": [-26.775, -51.015], "Lages": [-27.816, -50.326],
  "Curitibanos": [-27.283, -50.584], "Rio do Sul": [-27.214, -49.643], "Blumenau": [-26.919, -49.066],
  "Joinville": [-26.304, -48.846], "Itajaí": [-26.908, -48.662], "Florianópolis": [-27.595, -48.548],
  "Criciúma": [-28.678, -49.37], "Xanxerê": [-26.877, -52.404], "Fraiburgo": [-27.026, -50.921],
  "Campos Novos": [-27.401, -51.225], "Brusque": [-27.098, -48.917], "Jaraguá do Sul": [-26.486, -49.067],
};

const hora = (minAtras: number) => new Date(Date.now() - minAtras * 60_000).toISOString();
const dia = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const perm = (n: keyof typeof PADRAO_POR_NIVEL) => [...PADRAO_POR_NIVEL[n]];

const MOTORISTAS: [string, string, string, number][] = [
  ["Carlos Mendes", "TR-4513-HC", "Rio do Sul", 4],
  ["Anderson Lima", "TR-3381-KD", "Campos Novos", 12],
  ["Rafael Souza", "TR-2207-AB", "Lages", 2],
  ["João Pereira", "TR-1902-LM", "Florianópolis", 7],
  ["Marcos Vieira", "TR-5120-PQ", "Blumenau", 1],
  ["Paulo Andrade", "TR-3027-GH", "Criciúma", 33],
  ["Felipe Costa", "TR-6012-BW", "Joaçaba", 3],
  ["Tiago Nunes", "TR-2934-JU", "Chapecó", 18],
  ["Diego Ramos", "TR-4408-RT", "Joinville", 9],
  ["Bruno Teixeira", "TR-7741-ZX", "Videira", 150],
];

export const USUARIOS_SEED: Usuario[] = [
  { id: "u1", nome: "Matheus", email: "matheus@voidlog.com.br", telefone: "+55 49 99900-0001", nivel: "admin", permissoes: perm("admin"), ativo: true },
  { id: "u2", nome: "Juliana Rocha", email: "juliana@voidlog.com.br", telefone: "+55 49 99900-0002", nivel: "gestor", permissoes: perm("gestor"), ativo: true },
  { id: "u3", nome: "Patrícia Klein", email: "patricia@voidlog.com.br", telefone: "+55 49 99900-0003", nivel: "operador", permissoes: perm("operador"), ativo: true },
  { id: "u4", nome: "Renato Dias", email: "renato@voidlog.com.br", telefone: "+55 49 99900-0004", nivel: "operador", permissoes: ["ver_todas_nf", "conferir_canhoto", "exportar"], ativo: true },
  ...MOTORISTAS.map(([nome, placa, cidade, min], i): Usuario => {
    const [lat, lng] = CIDADES[cidade];
    return {
      id: `m${i + 1}`, nome, placa,
      email: `${nome.split(" ")[0].normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()}@voidlog.com.br`,
      telefone: `+55 49 99${String(100 + i * 37).padStart(3, "0")}-${String(4000 + i * 311)}`,
      nivel: "motorista", permissoes: perm("motorista"), ativo: true,
      local: { lat: lat + (r() - 0.5) * 0.08, lng: lng + (r() - 0.5) * 0.08, cidade, em: hora(min) },
    };
  }),
];

const CLIENTES = [
  "Mercado Bom Preço", "Agro Sul Ltda", "Distribuidora Oeste", "Supermercado Vale", "Casa do Campo",
  "Atacadão Serra", "Cooperativa Alfa", "Rede Super Top", "Madeireira Pinhal", "Frigorífico Aurora Sul",
  "Comercial Catarinense", "Bistek Supermercados", "Ferragens Planalto", "Laticínios Tirol", "Moinho Joaçaba",
];

/** Canhoto "fotografado" fictício (SVG) — só para a demonstração. */
function fotoFake(nf: string, cliente: string, recebedor: string, seed: number) {
  const rr = rng(seed);
  let p = "M40 250";
  for (let i = 0; i < 9; i++) p += ` q ${15 + rr() * 20} ${-40 + rr() * 80} ${30 + rr() * 25} ${-10 + rr() * 20}`;
  const rot = (rr() - 0.5) * 4;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340">
<rect width="600" height="340" fill="#6b6257"/>
<g transform="rotate(${rot} 300 170)"><rect x="20" y="22" width="560" height="296" fill="#f3efe6"/>
<g font-family="Arial" fill="#333"><text x="40" y="60" font-size="13" font-weight="bold">RECEBEMOS DE VOID LOGÍSTICA OS PRODUTOS CONSTANTES DA NOTA FISCAL</text>
<text x="40" y="92" font-size="12">NF-e Nº ${nf}   SÉRIE 1</text><text x="40" y="116" font-size="12">DESTINATÁRIO: ${cliente.toUpperCase()}</text>
<line x1="40" y1="140" x2="560" y2="140" stroke="#999"/><text x="40" y="168" font-size="11">DATA DE RECEBIMENTO</text>
<text x="300" y="168" font-size="11">IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR</text><text x="40" y="200" font-size="20" fill="#1d3b8f" font-family="cursive">${new Date().toLocaleDateString("pt-BR")}</text>
<text x="300" y="300" font-size="11" fill="#555">${recebedor.toUpperCase()}</text></g>
<path d="${p}" transform="translate(260 -10)" stroke="#1d3b8f" stroke-width="2.4" fill="none"/></g></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

const RECEBEDORES = ["Ana Paula", "José Carlos", "Mariana S.", "Roberto F.", "Luciana M.", "Edson R."];
const motoristas = USUARIOS_SEED.filter((u) => u.nivel === "motorista");

export const NOTAS_SEED: NotaFiscal[] = Array.from({ length: 72 }, (_, i): NotaFiscal => {
  const numero = String(4580 - i).padStart(6, "0");
  const emissao = Math.floor(i / 3.2);
  const cliente = pick(CLIENTES);
  const cidade = pick(Object.keys(CIDADES));
  const temMotorista = r() > 0.28;
  const motorista = temMotorista ? pick(motoristas) : null;

  let status: StatusCanhoto = "pendente";
  if (motorista) {
    const x = r();
    status = emissao < 2 ? (x < 0.6 ? "pendente" : "enviado") : x < 0.2 ? "pendente" : x < 0.45 ? "enviado" : x < 0.92 ? "conferido" : "recusado";
  } else if (emissao > 4 && r() > 0.5) status = "conferido";

  const nf: NotaFiscal = {
    id: `nf${i}`, numero, serie: "1", cliente, cidade,
    valor: Math.round((800 + r() * 24000) * 100) / 100,
    emissao: dia(emissao), motoristaId: motorista?.id ?? null, status, observacao: "",
  };
  if (status !== "pendente") {
    const rec = pick(RECEBEDORES);
    const [lat, lng] = CIDADES[cidade];
    nf.canhoto = {
      foto: fotoFake(numero, cliente, rec, i + 7),
      enviadoPor: motorista?.id ?? "u3",
      enviadoEm: hora(Math.max(20, emissao * 1440 - 240 - Math.floor(r() * 600))),
      recebedor: rec,
      local: { lat, lng },
    };
  }
  if (status === "conferido") nf.conferencia = { por: "u2", em: hora(Math.max(5, emissao * 1440 - 1100)) };
  if (status === "recusado") nf.conferencia = { por: "u2", em: hora(Math.max(10, emissao * 1440 - 900)), motivo: "Foto cortada, assinatura ilegível" };
  return nf;
});
