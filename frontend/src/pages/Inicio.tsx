/**
 * Tela Início — painel da operação.
 * Os cards da esquerda mostram o motorista escolhido na faixa do cabeçalho;
 * Atividade, Canhotos enviados e Motoristas mostram a frota toda.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import logoV from "../assets/void-v.png";
import { FluidoCard } from "../components/FluidoCard";
import { Icone } from "../components/Icone";
import { NovaNota } from "../components/NovaNota";
import { Anel, Avatar, Botao, Cabecalho, Card, FotoMotorista, GraficoAneis, Vazio, useAgora } from "../components/ui";
import { pode } from "../lib/acesso";
import { EMPRESA } from "../lib/config";
import { abertasDe, atrasadasDe, notasDe, offline, ordenarMotoristas, progressoDe } from "../lib/frota";
import { irPara } from "../lib/rota";
import { useEstado } from "../lib/store";
import type { NotaFiscal, Usuario } from "../lib/tipos";
import { atrasada, fmtMoeda, haQuanto, plural, primeiroNome } from "../lib/util";

export default function Inicio({ eu }: { eu: Usuario }) {
  const { usuarios, notas } = useEstado();
  const motoristas = useMemo(() => ordenarMotoristas(usuarios.filter((u) => u.nivel === "motorista" && u.ativo)), [usuarios]);
  const [selId, setSelId] = useState<string | null>(null);
  const [novaNota, setNovaNota] = useState(false);
  const sel = motoristas.find((m) => m.id === selId) ?? motoristas[0];

  return (
    <>
      <Cabecalho
        titulo={<>{EMPRESA} · <b>Operação</b></>}
        subtitulo={plural(motoristas.length, "motorista")}
        meio={sel && <FaixaMotoristas motoristas={motoristas} selId={sel.id} aoEscolher={setSelId} />}
        acao={pode(eu, "cadastrar_nf") && <Botao variante="contorno" icone="mais" onClick={() => setNovaNota(true)}>Nova NF</Botao>}
      />

      {!sel ? <Vazio>Nenhum motorista ativo. Cadastre um em Usuários.</Vazio> : (
        <div className="painel entra">
          <div className="area-foto"><CartaoFoto m={sel} /></div>
          <div className="area-rastreio"><CartaoRastreio m={sel} notas={notas} /></div>
          <div className="area-formato"><CartaoGraficos m={sel} notas={notas} /></div>
          <div className="area-atividade"><CartaoAtividade notas={notas} /></div>
          <div className="area-lateral"><ColunaNumeros m={sel} notas={notas} eu={eu} /></div>
          <div className="area-agenda"><CartaoAgenda notas={notas} /></div>
          <div className="area-lista"><CartaoMotoristas motoristas={motoristas} notas={notas} selId={sel.id} aoEscolher={setSelId} /></div>
        </div>
      )}

      {novaNota && <NovaNota eu={eu} aoFechar={() => setNovaNota(false)} />}
    </>
  );
}

/* ---------- Faixa de avatares no cabeçalho (5 por vez) ---------- */
const POR_VEZ = 5;

function FaixaMotoristas({ motoristas, selId, aoEscolher }: { motoristas: Usuario[]; selId: string; aoEscolher: (id: string) => void }) {
  const [inicio, setInicio] = useState(0);
  return (
    <div className="faixa">
      <Botao className="seta-faixa" icone="esquerda" aria-label="Anteriores" disabled={inicio === 0} onClick={() => setInicio(inicio - 1)} />
      {motoristas.slice(inicio, inicio + POR_VEZ).map((m) => (
        <button key={m.id} onClick={() => aoEscolher(m.id)} aria-pressed={m.id === selId}>
          <Avatar nome={m.nome} tamanho={26} anel={m.id === selId} />
        </button>
      ))}
      <Botao className="seta-faixa" icone="direita" aria-label="Próximos" disabled={inicio >= motoristas.length - POR_VEZ} onClick={() => setInicio(inicio + 1)} />
    </div>
  );
}

/* ---------- Foto do motorista ---------- */
function CartaoFoto({ m }: { m: Usuario }) {
  return (
    <FotoMotorista nome={m.nome}>
      <div>
        <strong className="corta">{m.nome}</strong>
        <span className="mini">{m.placa}</span>
      </div>
      <a className="botao-redondo" href={`tel:${m.telefone}`} title="Ligar" aria-label={`Ligar para ${m.nome}`}><Icone nome="telefone" tamanho={12} /></a>
      <a className="botao-redondo botao-destaque" href={`mailto:${m.email}`} title="E-mail" aria-label={`E-mail para ${m.nome}`}><Icone nome="email" tamanho={12} /></a>
    </FotoMotorista>
  );
}

/* ---------- Último sinal + próximas entregas ---------- */
/** 00:04:12 — e, passando de um dia, "4d 05:22". */
function relogio(seg: number) {
  const dois = (n: number) => String(n).padStart(2, "0");
  const h = Math.floor(seg / 3600), m = Math.floor(seg / 60) % 60, s = seg % 60;
  return h >= 24 ? `${Math.floor(h / 24)}d ${dois(h % 24)}:${dois(m)}` : `${dois(h)}:${dois(m)}:${dois(s)}`;
}

function CartaoRastreio({ m, notas }: { m: Usuario; notas: NotaFiscal[] }) {
  const agora = useAgora();
  const proximas = abertasDe(m.id, notas).sort((a, b) => a.emissao.localeCompare(b.emissao)).slice(0, 3);
  const seg = m.local ? Math.max(0, Math.floor((agora - new Date(m.local.em).getTime()) / 1000)) : 0;

  return (
    <Card titulo="Último sinal" acao={<Botao icone="pontos" aria-label="Ver motoristas" onClick={() => irPara("motoristas")} />}>
      <div className="relogio card-destaque">
        <div>
          <span className="mini">{m.local ? `${m.local.cidade}${offline(m) ? " · sem sinal" : ""}` : "Sem posição"}</span>
          <strong className="num">{m.local ? relogio(seg) : "--:--:--"}</strong>
        </div>
        {m.local && (
          <a className="botao-redondo" title="Abrir no mapa" aria-label="Abrir no mapa" target="_blank" rel="noreferrer"
            href={`https://www.google.com/maps?q=${m.local.lat},${m.local.lng}`}>
            <Icone nome="local" />
          </a>
        )}
      </div>
      <div className="rolagem">
        {proximas.length === 0 && <Vazio>Nenhuma entrega em aberto.</Vazio>}
        {proximas.map((n) => (
          <button key={n.id} className="tarefa" onClick={() => irPara("canhotos", { nf: n.id })}>
            <span className="tarefa-icone"><Icone nome="canhoto" tamanho={14} /></span>
            <div>
              <strong className="corta">NF {n.numero} · {n.cliente}</strong>
              <span className="mini">{n.cidade} · {fmtMoeda(n.valor)}</span>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

/* ---------- Dois gráficos de anéis: notas e canhotos do motorista ---------- */
const CORES = ["var(--destaque)", "var(--destaque-2)", "#5a5a5a"];

/** Cada item vira um anel; `status` é o filtro aberto na tela Canhotos ao clicar. */
type Item = { rotulo: string; status?: string; filtro: (n: NotaFiscal) => boolean };

const ITENS_NOTAS: Item[] = [
  { rotulo: "Concluídas", status: "conferido", filtro: (n) => n.status === "conferido" },
  { rotulo: "Em aberto", filtro: (n) => n.status !== "conferido" },
  { rotulo: "Atrasadas", status: "atrasadas", filtro: atrasada },
];
const ITENS_CANHOTOS: Item[] = [
  { rotulo: "Conferidos", status: "conferido", filtro: (n) => n.status === "conferido" },
  { rotulo: "A conferir", status: "enviado", filtro: (n) => n.status === "enviado" },
  { rotulo: "Recusados", status: "recusado", filtro: (n) => n.status === "recusado" },
];

function CartaoGraficos({ m, notas }: { m: Usuario; notas: NotaFiscal[] }) {
  const dele = notasDe(m.id, notas);
  const comCanhoto = dele.filter((n) => n.canhoto);

  const grafico = (titulo: string, itens: Item[], lista: NotaFiscal[], unidade: string) => (
    <GraficoAneis titulo={titulo} total={lista.length} unidade={unidade}
      segmentos={itens.map((it, i) => ({ rotulo: it.rotulo, valor: lista.filter(it.filtro).length, cor: CORES[i] }))}
      aoEscolher={(i) => irPara("canhotos", { motorista: m.id, status: itens[i].status })} />
  );

  return (
    <Card titulo={`Notas e canhotos de ${primeiroNome(m.nome)}`}
      acao={<Botao icone="pontos" aria-label="Ver canhotos" onClick={() => irPara("canhotos", { motorista: m.id })} />}>
      <div className="graficos">
        {grafico("Notas", ITENS_NOTAS, dele, "NFs")}
        {grafico("Canhotos", ITENS_CANHOTOS, comCanhoto, "enviados")}
      </div>
    </Card>
  );
}

/* ---------- Números + banner ---------- */
const moedaCurta = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function ColunaNumeros({ m, notas, eu }: { m: Usuario; notas: NotaFiscal[]; eu: Usuario }) {
  const abertas = abertasDe(m.id, notas);
  const aConferir = notas.filter((n) => n.status === "enviado").length;
  const confere = pode(eu, "conferir_canhoto");

  return (
    <div className="coluna">
      <div className="linha-2">
        <Card className="numero"><strong className="num">{abertas.length}</strong><span className="mini">Em aberto</span></Card>
        <Card className="numero"><strong className="num">{atrasadasDe(m.id, notas).length}</strong><span className="mini">Atrasadas</span></Card>
      </div>
      <Card className="numero">
        <strong className="num">{moedaCurta.format(abertas.reduce((s, n) => s + n.valor, 0))}</strong>
        <span className="mini">Valor em aberto</span>
      </Card>
      <button className="card card-destaque banner" onClick={() => irPara("canhotos", confere ? { status: "enviado" } : {})}>
        <FluidoCard logo={false} className="banner-fluido" />
        <div className="banner-topo">
          <img src={logoV} alt="" />
          <span>{confere ? `${aConferir} a conferir` : "Abrir"} <Icone nome="seta" tamanho={12} /></span>
        </div>
        <div>
          <h3>{confere ? "Conferir canhotos" : "Ver canhotos"}</h3>
          <span className="mini">{confere ? "Fotos enviadas aguardando aprovação" : "Notas e fotos dos canhotos"}</span>
        </div>
      </button>
    </div>
  );
}

/* ---------- Datas usadas pela Atividade e pela Agenda ---------- */
const DIA_MS = 86_400_000;
const inicioDoDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const diaSemana = (d: Date) => d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").slice(0, 3);

/* ---------- Atividade: envios de canhoto por dia e horário (últimos 7 dias) ---------- */
const FAIXAS = [18, 16, 14, 12, 10, 8, 6]; // início de cada faixa de 2h, de cima para baixo

function CartaoAtividade({ notas }: { notas: NotaFiscal[] }) {
  const hoje = inicioDoDia(new Date());
  const dias = Array.from({ length: 7 }, (_, i) => new Date(hoje - (6 - i) * DIA_MS));
  const grade = FAIXAS.map(() => dias.map(() => 0));
  let total = 0;

  for (const n of notas) {
    if (!n.canhoto) continue;
    const d = new Date(n.canhoto.enviadoEm);
    const col = 6 - Math.round((hoje - inicioDoDia(d)) / DIA_MS);
    if (col < 0 || col > 6) continue;
    const faixa = FAIXAS.findIndex((h) => d.getHours() >= h);
    grade[faixa === -1 ? FAIXAS.length - 1 : faixa][col]++;
    total++;
  }

  return (
    <Card titulo={<>Atividade <span className="contador">{plural(total, "envio")} · 7 dias</span></>}
      acao={<Icone nome="calendario" tamanho={14} />}>
      <div className="grade-legenda">
        {["0", "1", "2", "3+"].map((r, i) => <span key={r}><i className="grade-celula" data-n={i} />{r}</span>)}
      </div>
      <div className="grade">
        {FAIXAS.flatMap((h, l) => [
          <span key={h} className="grade-rotulo">{h}h</span>,
          ...grade[l].map((n, c) => (
            <span key={`${h}-${c}`} className="grade-celula" data-n={Math.min(n, 3)}
              title={`${diaSemana(dias[c])}, ${h}h: ${plural(n, "envio")}`} />
          )),
        ])}
        <span />
        {dias.map((d) => <span key={d.getTime()} className="grade-rotulo">{diaSemana(d)}</span>)}
      </div>
    </Card>
  );
}

/* ---------- Entregas: gráfico de área suave (canhotos enviados x conferidos por dia) ---------- */
const PERIODOS = [
  { rotulo: "3 meses", dias: 90 },
  { rotulo: "30 dias", dias: 30 },
  { rotulo: "7 dias", dias: 7 },
] as const;
const MARGEM = { topo: 14, base: 22 };

/** Curva suave (Catmull-Rom → Bézier) por todos os pontos, sem estourar o mínimo/máximo vizinho. */
function curva(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const lo = Math.min(p1[1], p2[1]), hi = Math.max(p1[1], p2[1]);
    const c1y = Math.min(hi, Math.max(lo, p1[1] + (p2[1] - p0[1]) / 6));
    const c2y = Math.min(hi, Math.max(lo, p2[1] - (p3[1] - p1[1]) / 6));
    d += `C${p1[0] + (p2[0] - p0[0]) / 6},${c1y} ${p2[0] - (p3[0] - p1[0]) / 6},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Média ponderada gaussiana: tira os "dentes" da contagem diária e deixa só a tendência. */
function suavizar(serie: number[], sigma: number) {
  const raio = Math.ceil(sigma * 3);
  return serie.map((_, i) => {
    let soma = 0, peso = 0;
    for (let k = -raio; k <= raio; k++) {
      const j = Math.min(serie.length - 1, Math.max(0, i + k)); // borda repete o último valor
      const p = Math.exp(-(k * k) / (2 * sigma * sigma));
      soma += serie[j] * p; peso += p;
    }
    return soma / peso;
  });
}

function CartaoAgenda({ notas }: { notas: NotaFiscal[] }) {
  const [periodo, setPeriodo] = useState<number>(PERIODOS[1].dias);
  const [hover, setHover] = useState<number | null>(null);
  const [tam, setTam] = useState({ w: 0, h: 0 });
  const area = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = area.current!;
    const ro = new ResizeObserver(() => setTam({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hoje = inicioDoDia(new Date());
  const { dias, enviados, conferidos, total } = useMemo(() => {
    const dias = Array.from({ length: periodo }, (_, i) => new Date(hoje - (periodo - 1 - i) * DIA_MS));
    const enviados = dias.map(() => 0), conferidos = dias.map(() => 0);
    let total = 0;
    for (const n of notas) {
      if (!n.canhoto) continue;
      const col = periodo - 1 - Math.round((hoje - inicioDoDia(new Date(n.canhoto.enviadoEm))) / DIA_MS);
      if (col < 0 || col >= periodo) continue;
      enviados[col]++; total++;
      if (n.status === "conferido") conferidos[col]++;
    }
    return { dias, enviados, conferidos, total };
  }, [notas, periodo, hoje]);

  const { w, h } = tam;
  const alto = Math.max(1, h - MARGEM.topo - MARGEM.base);
  const sigma = Math.max(1, periodo / 22);
  const sA = useMemo(() => suavizar(enviados, sigma), [enviados, sigma]);
  const sB = useMemo(() => suavizar(conferidos, sigma), [conferidos, sigma]);
  const max = Math.max(2, ...sA) * 1.3;
  const x = (i: number) => (periodo === 1 ? 0 : (i / (periodo - 1)) * w);
  const y = (v: number) => MARGEM.topo + alto - (v / max) * alto;
  const pontos = (serie: number[]) => serie.map((v, i) => [x(i), y(v)] as [number, number]);
  const base = MARGEM.topo + alto;
  const linhaA = curva(pontos(sA)), linhaB = curva(pontos(sB));
  const fecha = (l: string) => `${l}L${w},${base}L0,${base}Z`;

  const fmtData = (d: Date, longa = false) =>
    d.toLocaleDateString("pt-BR", longa ? { day: "2-digit", month: "short", year: "numeric" } : { day: "2-digit", month: "short" }).replace(".", "");
  const nTicks = Math.min(6, periodo);
  const ticks = Array.from({ length: nTicks }, (_, i) => Math.round((i / (nTicks - 1)) * (periodo - 1)));

  function mover(e: React.PointerEvent) {
    const r = area.current!.getBoundingClientRect();
    setHover(Math.min(periodo - 1, Math.max(0, Math.round(((e.clientX - r.left) / r.width) * (periodo - 1)))));
  }

  return (
    <Card className="envios"
      titulo={<span className="envios-titulo"><b>Canhotos enviados</b><small>{plural(total, "envio")} nos últimos {PERIODOS.find((p) => p.dias === periodo)!.rotulo}</small></span>}
      acao={
        <div className="envios-periodos" role="group" aria-label="Período">
          {PERIODOS.map((p) => (
            <button key={p.dias} aria-pressed={p.dias === periodo} onClick={() => { setPeriodo(p.dias); setHover(null); }}>{p.rotulo}</button>
          ))}
        </div>
      }>
      <div className="envios-area" ref={area} onPointerMove={mover} onPointerLeave={() => setHover(null)}>
        {w > 0 && h > 0 && (
          <svg width={w} height={h} role="img" aria-label="Canhotos enviados e conferidos por dia">
            <defs>
              <linearGradient id="env-a" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f5f5f3" stopOpacity="0.5" /><stop offset="1" stopColor="#f5f5f3" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="env-b" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#9a9a9a" stopOpacity="0.55" /><stop offset="1" stopColor="#9a9a9a" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={w} y1={MARGEM.topo + alto * f} y2={MARGEM.topo + alto * f} className="envios-grade" />)}
            <path d={fecha(linhaA)} fill="url(#env-a)" />
            <path d={linhaA} className="envios-linha" stroke="#f5f5f3" />
            <path d={fecha(linhaB)} fill="url(#env-b)" />
            <path d={linhaB} className="envios-linha" stroke="#9a9a9a" />
            {ticks.map((i, k) => (
              <text key={i} x={Math.min(w - 2, Math.max(2, x(i)))} y={h - 5} className="envios-rotulo"
                textAnchor={k === 0 ? "start" : k === ticks.length - 1 ? "end" : "middle"}>{fmtData(dias[i])}</text>
            ))}
            {hover !== null && (
              <g>
                <line x1={x(hover)} x2={x(hover)} y1={MARGEM.topo} y2={base} className="envios-guia" />
                <circle cx={x(hover)} cy={y(sA[hover])} r="3.5" fill="#f5f5f3" />
                <circle cx={x(hover)} cy={y(sB[hover])} r="3.5" fill="#9a9a9a" />
              </g>
            )}
          </svg>
        )}
        {hover !== null && w > 0 && (
          <div className="envios-dica" style={{ left: x(hover), top: Math.max(4, y(sA[hover]) - 70), transform: `translateX(${x(hover) > w * 0.7 ? "calc(-100% - 12px)" : "12px"})` }}>
            <strong>{fmtData(dias[hover], true)}</strong>
            <span><i style={{ background: "#f5f5f3" }} />Enviados <b>{enviados[hover]}</b></span>
            <span><i style={{ background: "#9a9a9a" }} />Conferidos <b>{conferidos[hover]}</b></span>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------- Lista de motoristas ---------- */
function CartaoMotoristas({ motoristas, notas, selId, aoEscolher }: {
  motoristas: Usuario[]; notas: NotaFiscal[]; selId: string; aoEscolher: (id: string) => void;
}) {
  return (
    <Card titulo={<>Motoristas <span className="contador">{motoristas.length}</span></>}
      acao={<Botao icone="pontos" aria-label="Ver motoristas" onClick={() => irPara("motoristas")} />}>
      <div className="rolagem">
        {motoristas.map((m) => (
          <button key={m.id} className={`lista-item ${m.id === selId ? "ativo" : ""} ${offline(m) ? "sem-sinal" : ""}`}
            onClick={() => aoEscolher(m.id)}>
            <Avatar nome={m.nome} tamanho={30} />
            <div>
              <strong className="corta">{m.nome}</strong>
              <span className="mini">{plural(abertasDe(m.id, notas).length, "aberta")} · {offline(m) ? "sem sinal" : haQuanto(m.local!.em)}</span>
            </div>
            <Anel valor={progressoDe(m.id, notas)} />
          </button>
        ))}
      </div>
    </Card>
  );
}
