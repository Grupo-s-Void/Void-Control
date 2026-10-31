/**
 * Tela Início — painel da operação.
 * Os cards da esquerda mostram o motorista escolhido na faixa do cabeçalho;
 * Atividade, Entregas da semana e Motoristas mostram a frota toda.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import logoV from "../assets/void-v.png";
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
          <div className="area-agenda"><CartaoAgenda notas={notas} usuarios={usuarios} /></div>
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

/* ---------- Entregas da semana: canhotos enviados no dia, por horário ---------- */
const HORA_INICIO = 7, HORA_FIM = 19, ALTURA_HORA = 46, ALTURA_EVENTO = 40, COLUNAS = 3;

function CartaoAgenda({ notas, usuarios }: { notas: NotaFiscal[]; usuarios: Usuario[] }) {
  const hoje = new Date();
  const [semana, setSemana] = useState(0);           // 0 = esta semana, -1 = anterior...
  const [diaSel, setDiaSel] = useState(hoje.getDay());
  const corpo = useRef<HTMLDivElement>(null);
  const domingo = inicioDoDia(hoje) - hoje.getDay() * DIA_MS + semana * 7 * DIA_MS;
  const dias = Array.from({ length: 7 }, (_, i) => new Date(domingo + i * DIA_MS));
  const diaMs = dias[diaSel].getTime();

  // posiciona cada envio na sua hora, em até 3 colunas para não sobrepor
  const eventos = useMemo(() => {
    const livreAte = Array(COLUNAS).fill(-Infinity);
    return notas
      .filter((n) => n.canhoto && inicioDoDia(new Date(n.canhoto.enviadoEm)) === diaMs)
      .sort((a, b) => a.canhoto!.enviadoEm.localeCompare(b.canhoto!.enviadoEm))
      .map((n) => {
        const d = new Date(n.canhoto!.enviadoEm);
        const horas = Math.min(Math.max(d.getHours() + d.getMinutes() / 60, HORA_INICIO), HORA_FIM - 0.9);
        const topo = (horas - HORA_INICIO) * ALTURA_HORA;
        let coluna = livreAte.findIndex((f) => f <= topo);
        if (coluna === -1) coluna = livreAte.indexOf(Math.min(...livreAte));
        livreAte[coluna] = topo + ALTURA_EVENTO + 4;
        return { n, topo, coluna };
      });
  }, [notas, diaMs]);

  // rola até o primeiro envio do dia
  useEffect(() => {
    corpo.current?.scrollTo({ top: eventos.length ? Math.max(0, eventos[0].topo - 20) : ALTURA_HORA, behavior: "smooth" });
  }, [eventos]);

  const nomeDe = (id: string) => usuarios.find((u) => u.id === id)?.nome ?? "?";
  const agoraTopo = diaMs === inicioDoDia(hoje) ? (hoje.getHours() + hoje.getMinutes() / 60 - HORA_INICIO) * ALTURA_HORA : -1;

  return (
    <Card titulo={<>Entregas da semana <span className="contador">{plural(eventos.length, "canhoto")}</span></>}
      acao={<>
        <Botao icone="esquerda" aria-label="Semana anterior" onClick={() => setSemana(semana - 1)} />
        <Botao icone="direita" aria-label="Próxima semana" disabled={semana >= 0} onClick={() => setSemana(semana + 1)} />
      </>}>
      <div className="agenda-dias pilulas">
        {dias.map((d, i) => (
          <button key={i} className={`pilula ${i === diaSel ? "ativa" : ""}`} onClick={() => setDiaSel(i)}>
            {diaSemana(d)} <small>{d.getDate()}</small>
          </button>
        ))}
      </div>
      {eventos.length === 0 && <p className="mini agenda-aviso">Nenhum canhoto enviado neste dia.</p>}
      <div className="agenda-corpo" ref={corpo}>
        {Array.from({ length: HORA_FIM - HORA_INICIO + 1 }, (_, i) => (
          <div key={i} className="agenda-hora"><span>{String(HORA_INICIO + i).padStart(2, "0")}:00</span></div>
        ))}
        <div className="agenda-eventos">
          {agoraTopo > 0 && <div className="agenda-agora" style={{ top: agoraTopo }} />}
          {eventos.map(({ n, topo, coluna }) => (
            <button key={n.id} className={`evento ${n.status === "enviado" ? "card-destaque" : ""}`}
              style={{ top: topo, left: `${coluna * 34}%` }} title={`NF ${n.numero} · ${n.cliente}`}
              onClick={() => irPara("canhotos", { nf: n.id })}>
              <div>
                <strong>NF {n.numero}</strong>
                <small className="corta">{n.cliente}</small>
              </div>
              <Avatar nome={nomeDe(n.canhoto!.enviadoPor)} tamanho={20} />
            </button>
          ))}
        </div>
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
