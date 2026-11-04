/** Peças visuais usadas em todas as telas. Estilos em styles/global.css (seção 4). */
import { useCallback, useEffect, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import type { StatusCanhoto } from "../lib/tipos";
import { STATUS, iniciais } from "../lib/util";
import { BrilhoDither, LuaPixel } from "./Dither";
import { Icone, type NomeIcone } from "./Icone";

/* ---------- Card ---------- */
export function Card({ titulo, acao, className = "", children }: {
  titulo?: ReactNode; acao?: ReactNode; className?: string; children: ReactNode;
}) {
  return (
    <section className={`card ${className}`}>
      {(titulo || acao) && (
        <header className="card-topo">
          <h2 className="card-titulo">{titulo}</h2>
          {acao}
        </header>
      )}
      {children}
    </section>
  );
}

/* ---------- Cabeçalho da tela: título | meio | ação ---------- */
export function Cabecalho({ titulo, subtitulo, meio, acao }: {
  titulo: ReactNode; subtitulo?: ReactNode; meio?: ReactNode; acao?: ReactNode;
}) {
  return (
    <div className="cabecalho">
      <div className="cabecalho-titulo">
        <h1>{titulo}</h1>
        {subtitulo && <p className="mini">{subtitulo}</p>}
      </div>
      <div className="cabecalho-meio">{meio}</div>
      <div className="cabecalho-acao">{acao}</div>
    </div>
  );
}

/* ---------- Botão (só com ícone vira quadrado) ---------- */
type BotaoProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "escuro" | "destaque" | "contorno" | "perigo";
  icone?: NomeIcone;
};

export function Botao({ variante = "escuro", icone, className = "", children, ...resto }: BotaoProps) {
  const soIcone = icone && !children ? "botao-icone" : "";
  return (
    <button type="button" className={`botao botao-${variante} ${soIcone} ${className}`} {...resto}>
      {icone && <Icone nome={icone} tamanho={14} />}
      {children}
    </button>
  );
}

/* ---------- Avatar: iniciais numa cor suave, sempre a mesma para cada pessoa ---------- */
const TONS = ["#d7fefa", "#c9e4f5", "#ece3d2", "#dcd6f5", "#f5d6d6", "#d6f0d9", "#f5ead0"];

function corDe(texto: string) {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONS[h % TONS.length];
}

export function Avatar({ nome, tamanho = 32, anel = false }: { nome: string; tamanho?: number; anel?: boolean }) {
  return (
    <span className="avatar" title={nome} style={{
      width: tamanho, height: tamanho, fontSize: tamanho * 0.36, background: corDe(nome),
      boxShadow: anel ? "0 0 0 2px var(--fundo), 0 0 0 4px var(--destaque)" : undefined,
    }}>
      {iniciais(nome)}
    </span>
  );
}

/** "Foto" grande do motorista: iniciais sobre um brilho em dither na cor dele. */
export function FotoMotorista({ nome, children }: { nome: string; children?: ReactNode }) {
  return (
    <div className="card foto">
      <div className="foto-fundo"><BrilhoDither cor={corDe(nome)} /><b>{iniciais(nome)}</b></div>
      {children && <div className="foto-faixa">{children}</div>}
    </div>
  );
}

/* ---------- Etiqueta de status do canhoto ---------- */
export function Etiqueta({ status }: { status: StatusCanhoto }) {
  const s = STATUS[status];
  return <span className="etiqueta" style={{ "--cor": s.cor } as CSSProperties}>{s.rotulo}</span>;
}

/* ---------- Anel pequeno de progresso (0–100) ---------- */
export function Anel({ valor, tamanho = 30 }: { valor: number; tamanho?: number }) {
  const c = tamanho / 2, r = c - 3, volta = 2 * Math.PI * r;
  return (
    <svg width={tamanho} height={tamanho} aria-label={`${valor}%`}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--card-3)" strokeWidth="2.5" />
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--texto)" strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray={`${(valor / 100) * volta} ${volta}`} transform={`rotate(-90 ${c} ${c})`} />
      <text x="50%" y="50%" dy=".35em" textAnchor="middle" fill="currentColor" className="anel-texto">{valor}%</text>
    </svg>
  );
}

/* ---------- Gráfico de anéis concêntricos (interativo) ---------- */
type Segmento = { rotulo: string; valor: number; cor: string };

/**
 * Cada anel mostra quanto o segmento representa do `total`.
 * Passar o mouse (ou focar a legenda) destaca o anel e mostra o valor no centro;
 * clicar chama `aoEscolher(índice)`. Os anéis "enchem" ao aparecer.
 */
export function GraficoAneis({ titulo, segmentos, total, unidade, aoEscolher }: {
  titulo: string; segmentos: Segmento[]; total: number; unidade: string; aoEscolher?: (i: number) => void;
}) {
  const [cheio, setCheio] = useState(false);
  const [ativo, setAtivo] = useState<number | null>(null);
  useEffect(() => { const q = requestAnimationFrame(() => setCheio(true)); return () => cancelAnimationFrame(q); }, []);

  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);
  const sel = ativo === null ? null : segmentos[ativo];
  const eventos = (i: number) => ({
    onMouseEnter: () => setAtivo(i), onMouseLeave: () => setAtivo(null),
    onFocus: () => setAtivo(i), onBlur: () => setAtivo(null), onClick: () => aoEscolher?.(i),
  });

  return (
    <div className={`grafico ${ativo !== null ? "focado" : ""}`}>
      <p className="espacado">{titulo}</p>
      <div className="aneis">
        <svg viewBox="0 0 150 150" role="img" aria-label={`${titulo}: ${segmentos.map((s) => `${s.rotulo} ${s.valor}`).join(", ")}`}>
          {segmentos.map((s, i) => {
            const r = 67 - i * 15, volta = 2 * Math.PI * r;
            const arco = cheio && total ? Math.max(0.001, (s.valor / total) * volta) : 0.001;
            return (
              <g key={s.rotulo} className={ativo === i ? "ativo" : ""} transform="rotate(-90 75 75)" {...eventos(i)}>
                <circle cx="75" cy="75" r={r} fill="none" stroke="var(--card-2)" strokeWidth="9" />
                <circle cx="75" cy="75" r={r} fill="none" stroke={s.cor} strokeWidth="9" strokeLinecap="round" strokeOpacity={s.valor ? 1 : 0}
                  strokeDasharray={`${arco} ${volta}`} style={{ transitionDelay: `${i * 120}ms` }} />
              </g>
            );
          })}
        </svg>
        <div className="aneis-centro">
          <strong className="num">{sel ? sel.valor : total}</strong>
          <span className="mini">{sel ? `${pct(sel.valor)}% · ${sel.rotulo}` : unidade}</span>
        </div>
      </div>
      <div className="legenda">
        {segmentos.map((s, i) => (
          <button key={s.rotulo} className={ativo === i ? "ativo" : ""} style={{ "--cor": s.cor } as CSSProperties} {...eventos(i)}>
            {s.rotulo}<b className="num">{pct(s.valor)}%</b>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Modal ---------- */
const SAIDA_MODAL_MS = 200; // igual a --t-medio no CSS

/** `children` pode ser uma função que recebe `fechar`, para fechar com a animação de saída. */
export function Modal({ titulo, aoFechar, children }: {
  titulo: string; aoFechar: () => void; children: ReactNode | ((fechar: () => void) => ReactNode);
}) {
  const [fechando, setFechando] = useState(false);
  const fechar = useCallback(() => { setFechando(true); setTimeout(aoFechar, SAIDA_MODAL_MS); }, [aoFechar]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [fechar]);

  return (
    <div className={`fundo-modal ${fechando ? "fechando" : ""}`} onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
      <Card className="modal" titulo={titulo} acao={<Botao icone="fechar" aria-label="Fechar" onClick={fechar} />}>
        {typeof children === "function" ? children(fechar) : children}
      </Card>
    </div>
  );
}

export const Vazio = ({ children }: { children: ReactNode }) => (
  <div className="vazio"><LuaPixel /><p>{children}</p></div>
);

/** Hora atual, atualizada a cada `ms` (para relógios na tela). */
export function useAgora(ms = 1000) {
  const [agora, setAgora] = useState(Date.now);
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return agora;
}
