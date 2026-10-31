/**
 * Tela Canhotos — lista de notas à esquerda, canhoto da nota escolhida à direita.
 * Filtros ficam no endereço (?status=enviado&motorista=m1&nf=nf3).
 */
import { useState } from "react";
import { Icone } from "../components/Icone";
import { NovaNota } from "../components/NovaNota";
import { Avatar, Botao, Cabecalho, Card, Etiqueta, Vazio } from "../components/ui";
import { pode } from "../lib/acesso";
import { useBusca } from "../lib/busca";
import { irPara, useRota } from "../lib/rota";
import { acoes, useEstado } from "../lib/store";
import type { NotaFiscal, StatusCanhoto, Usuario } from "../lib/tipos";
import {
  atrasada, comprimirImagem, diasDesde, exportarCSV, fmtData, fmtDataHora, fmtMoeda, normalizar, plural, primeiroNome,
} from "../lib/util";

type Filtro = "todas" | StatusCanhoto | "atrasadas";

const FILTROS: { id: Filtro; rotulo: string; teste: (n: NotaFiscal) => boolean }[] = [
  { id: "todas", rotulo: "Todas", teste: () => true },
  { id: "pendente", rotulo: "Pendentes", teste: (n) => n.status === "pendente" },
  { id: "enviado", rotulo: "A conferir", teste: (n) => n.status === "enviado" },
  { id: "recusado", rotulo: "Recusadas", teste: (n) => n.status === "recusado" },
  { id: "conferido", rotulo: "Conferidas", teste: (n) => n.status === "conferido" },
  { id: "atrasadas", rotulo: "Atrasadas", teste: atrasada },
];

export default function Canhotos({ eu }: { eu: Usuario }) {
  const { usuarios, notas } = useEstado();
  const { params } = useRota();
  const busca = normalizar(useBusca());
  const [novaNota, setNovaNota] = useState(false);

  const filtro = FILTROS.find((f) => f.id === params.get("status")) ?? FILTROS[0];
  const motoristaId = params.get("motorista") ?? undefined;
  const nfId = params.get("nf") ?? undefined;
  const mudar = (p: { status?: string; motorista?: string; nf?: string }) =>
    irPara("canhotos", { status: filtro.id === "todas" ? undefined : filtro.id, motorista: motoristaId, nf: nfId, ...p });

  const nomeDe = (id: string | null) => usuarios.find((u) => u.id === id)?.nome ?? "—";

  // 1. o que esta pessoa pode ver  2. motorista e busca  3. filtro de status
  const visiveis = pode(eu, "ver_todas_nf") ? notas : notas.filter((n) => n.motoristaId === eu.id);
  const base = visiveis.filter((n) =>
    (!motoristaId || n.motoristaId === motoristaId) &&
    (!busca || normalizar(`${n.numero} ${n.cliente} ${n.cidade} ${nomeDe(n.motoristaId)}`).includes(busca)),
  );
  const lista = base.filter(filtro.teste).sort((a, b) => b.emissao.localeCompare(a.emissao) || b.numero.localeCompare(a.numero));
  const selecionada = visiveis.find((n) => n.id === nfId);
  const aConferir = visiveis.filter((n) => n.status === "enviado").length;

  return (
    <>
      <Cabecalho
        titulo={<>Controle de <b>canhotos</b></>}
        subtitulo={`${plural(visiveis.length, "nota")} · ${aConferir} a conferir`}
        meio={
          <div className="pilulas pilulas-linha" role="tablist">
            {FILTROS.map((f) => (
              <button key={f.id} role="tab" aria-selected={f.id === filtro.id}
                className={`pilula ${f.id === filtro.id ? "ativa" : ""}`}
                onClick={() => mudar({ status: f.id === "todas" ? "" : f.id })}>
                {f.rotulo} <small>{base.filter(f.teste).length}</small>
              </button>
            ))}
          </div>
        }
        acao={<>
          {pode(eu, "exportar") && <Botao variante="contorno" icone="baixar" onClick={() => exportarCSV(lista, nomeDe)}>Exportar</Botao>}
          {pode(eu, "cadastrar_nf") && <Botao variante="destaque" icone="mais" onClick={() => setNovaNota(true)}>Nova NF</Botao>}
        </>}
      />

      <div className="lista-detalhe entra">
        <Card>
          {motoristaId && (
            <span className="etiqueta filtro-motorista">
              Motorista: {nomeDe(motoristaId)}
              <button aria-label="Tirar filtro de motorista" onClick={() => mudar({ motorista: "" })}><Icone nome="fechar" tamanho={12} /></button>
            </span>
          )}
          {lista.length === 0 ? <Vazio>Nenhuma nota encontrada.</Vazio> : (
            <div className="rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>NF</th><th>Cliente</th><th className="some-celular">Cidade</th><th className="some-celular">Emissão</th>
                    <th className="some-celular">Motorista</th><th className="some-celular direita">Valor</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((n) => (
                    <tr key={n.id} className={n.id === nfId ? "ativa" : ""} onClick={() => mudar({ nf: n.id })}>
                      <td className="num"><strong>{n.numero}</strong><span className="mini"> /{n.serie}</span></td>
                      <td>{n.cliente}</td>
                      <td className="some-celular mudo">{n.cidade}</td>
                      <td className="some-celular mudo num">
                        {fmtData(n.emissao)}
                        {atrasada(n) && <span className="atraso">{diasDesde(n.emissao)} dias</span>}
                      </td>
                      <td className="some-celular">
                        {n.motoristaId
                          ? <span className="pessoa"><Avatar nome={nomeDe(n.motoristaId)} tamanho={22} />{primeiroNome(nomeDe(n.motoristaId))}</span>
                          : <span className="mudo">—</span>}
                      </td>
                      <td className="some-celular direita num">{fmtMoeda(n.valor)}</td>
                      <td><Etiqueta status={n.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {selecionada
          ? <Detalhe key={selecionada.id} nota={selecionada} eu={eu} usuarios={usuarios} aoFechar={() => mudar({ nf: "" })} />
          : <Card className="detalhe"><Vazio>Escolha uma nota na lista para ver o canhoto.</Vazio></Card>}
      </div>

      {novaNota && <NovaNota eu={eu} aoFechar={() => setNovaNota(false)} />}
    </>
  );
}

/* ---------- Painel da nota escolhida ---------- */
function Detalhe({ nota: n, eu, usuarios, aoFechar }: {
  nota: NotaFiscal; eu: Usuario; usuarios: Usuario[]; aoFechar: () => void;
}) {
  const nomeDe = (id?: string | null) => usuarios.find((u) => u.id === id)?.nome ?? "—";
  const motoristas = usuarios.filter((u) => u.nivel === "motorista" && u.ativo);
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState("");

  const podeConferir = pode(eu, "conferir_canhoto") && n.status === "enviado";
  const podeEnviar = pode(eu, "enviar_canhoto") && (n.status === "pendente" || n.status === "recusado") &&
    (pode(eu, "ver_todas_nf") || n.motoristaId === eu.id);

  return (
    <Card className="detalhe aberto"
      titulo={<>NF {n.numero} <Etiqueta status={n.status} /></>}
      acao={<Botao className="fechar-detalhe" icone="fechar" aria-label="Fechar" onClick={aoFechar} />}>

      {(n.canhoto || !podeEnviar) && (
        <div className="detalhe-foto">
          {n.canhoto
            ? <a href={n.canhoto.foto} target="_blank" rel="noreferrer" title="Abrir foto"><img src={n.canhoto.foto} alt={`Canhoto da NF ${n.numero}`} /></a>
            : <div><Icone nome="camera" tamanho={28} /><p className="mini">Canhoto ainda não enviado</p></div>}
        </div>
      )}

      {n.status === "recusado" && n.conferencia?.motivo && <p className="motivo">Recusado: {n.conferencia.motivo}</p>}

      <dl className="dados">
        <dt>Cliente</dt><dd>{n.cliente}</dd>
        <dt>Cidade</dt><dd>{n.cidade}</dd>
        <dt>Valor</dt><dd className="num">{fmtMoeda(n.valor)}</dd>
        <dt>Emissão</dt><dd className="num">{fmtData(n.emissao)}{atrasada(n) && <span className="atraso">atrasada · {diasDesde(n.emissao)} dias</span>}</dd>
        <dt>Motorista</dt>
        <dd>
          {pode(eu, "atribuir_motorista") && n.status !== "conferido" ? (
            <select className="entrada" value={n.motoristaId ?? ""} aria-label="Motorista"
              onChange={(e) => acoes.atribuir([n.id], e.target.value || null)}>
              <option value="">Sem motorista</option>
              {motoristas.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          ) : nomeDe(n.motoristaId)}
        </dd>
        {n.canhoto && <>
          <dt>Recebedor</dt><dd>{n.canhoto.recebedor}</dd>
          <dt>Enviado</dt><dd>{fmtDataHora(n.canhoto.enviadoEm)} · {primeiroNome(nomeDe(n.canhoto.enviadoPor))}</dd>
        </>}
        {n.conferencia && <>
          <dt>{n.status === "recusado" ? "Recusado" : "Conferido"}</dt>
          <dd>{fmtDataHora(n.conferencia.em)} · {primeiroNome(nomeDe(n.conferencia.por))}</dd>
        </>}
      </dl>

      {podeConferir && !recusando && (
        <div className="acoes">
          <Botao variante="perigo" icone="fechar" onClick={() => setRecusando(true)}>Recusar</Botao>
          <Botao variante="destaque" icone="check" onClick={() => acoes.conferir(n.id, true, eu.id)}>Aprovar</Botao>
        </div>
      )}
      {podeConferir && recusando && (
        <form className="formulario" onSubmit={(e) => { e.preventDefault(); acoes.conferir(n.id, false, eu.id, motivo.trim()); }}>
          <label className="campo"><span>Por que está recusando?</span>
            <input className="entrada" autoFocus required value={motivo} onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: foto cortada, assinatura ilegível" />
          </label>
          <div className="acoes">
            <Botao onClick={() => setRecusando(false)}>Voltar</Botao>
            <Botao type="submit" variante="perigo">Confirmar recusa</Botao>
          </div>
        </form>
      )}

      {podeEnviar && <EnviarCanhoto nota={n} eu={eu} />}
    </Card>
  );
}

/* ---------- Envio da foto (funciona no celular: abre a câmera) ---------- */
const posicaoAtual = () =>
  new Promise<{ lat: number; lng: number } | undefined>((ok) => {
    if (!navigator.geolocation) return ok(undefined);
    navigator.geolocation.getCurrentPosition(
      (p) => ok({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => ok(undefined),
      { timeout: 5000 },
    );
  });

function EnviarCanhoto({ nota, eu }: { nota: NotaFiscal; eu: Usuario }) {
  const [foto, setFoto] = useState("");
  const [recebedor, setRecebedor] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function escolher(arquivo?: File) {
    if (!arquivo) return;
    setErro("");
    try { setFoto(await comprimirImagem(arquivo)); }
    catch (e) { setErro((e as Error).message); }
  }

  async function enviar() {
    setEnviando(true);
    const local = await posicaoAtual();
    if (local && eu.nivel === "motorista") acoes.atualizarLocal(eu.id, local.lat, local.lng);
    acoes.enviarCanhoto(nota.id, foto, recebedor.trim(), eu.id, local);
  }

  return (
    <div className="formulario">
      {foto
        ? <img className="envio-previa" src={foto} alt="Prévia do canhoto" />
        : (
          <label className="envio-foto">
            <Icone nome="camera" tamanho={24} />
            <strong>Fotografar canhoto</strong>
            <span className="mini">ou escolher uma imagem</span>
            <input type="file" accept="image/*" capture="environment" onChange={(e) => escolher(e.target.files?.[0])} />
          </label>
        )}
      {erro && <p className="motivo">{erro}</p>}
      <label className="campo"><span>Quem recebeu</span>
        <input className="entrada" value={recebedor} onChange={(e) => setRecebedor(e.target.value)} placeholder="Nome de quem assinou" />
      </label>
      <div className="acoes">
        {foto && <Botao onClick={() => setFoto("")}>Trocar foto</Botao>}
        <Botao variante="destaque" icone="check" disabled={!foto || !recebedor.trim() || enviando} onClick={enviar}>
          {enviando ? "Enviando…" : "Enviar canhoto"}
        </Botao>
      </div>
    </div>
  );
}
