/**
 * Tela Usuários — lista à esquerda, edição à direita.
 * Regras em lib/acesso.ts: só se gerencia quem tem nível menor que o seu,
 * e só se concede permissão que você mesmo tem.
 */
import { useState, type FormEvent } from "react";
import { Avatar, Botao, Cabecalho, Card, Vazio } from "../components/ui";
import { NIVEIS, PADRAO_POR_NIVEL, PERMISSOES, niveisGerenciaveis, pode, podeGerenciarNivel, type Nivel, type Permissao } from "../lib/acesso";
import { acoes, useEstado } from "../lib/store";
import type { Usuario } from "../lib/tipos";
import { plural } from "../lib/util";

export default function Usuarios({ eu }: { eu: Usuario }) {
  const { usuarios } = useEstado();
  const [selId, setSelId] = useState<string | null>(null);
  const niveis = niveisGerenciaveis(eu);
  // nível mais alto primeiro, depois por nome
  const lista = [...usuarios].sort((a, b) => NIVEIS[b.nivel].peso - NIVEIS[a.nivel].peso || a.nome.localeCompare(b.nome));
  const sel = usuarios.find((u) => u.id === selId);

  return (
    <>
      <Cabecalho titulo={<>Equipe e <b>acessos</b></>} subtitulo={plural(usuarios.filter((u) => u.ativo).length, "usuário ativo", "usuários ativos")}
        acao={niveis.length > 0 && <Botao variante="destaque" icone="mais" onClick={() => setSelId("novo")}>Novo usuário</Botao>} />

      <div className="lista-detalhe entra">
        <Card>
          <div className="rolagem">
            <table className="tabela">
              <thead><tr><th>Nome</th><th className="some-celular">E-mail</th><th>Nível</th><th className="some-celular">Situação</th></tr></thead>
              <tbody>
                {lista.map((u) => (
                  <tr key={u.id} className={u.id === selId ? "ativa" : ""} onClick={() => setSelId(u.id)}>
                    <td><span className="pessoa"><Avatar nome={u.nome} tamanho={26} />{u.nome}{u.id === eu.id && <span className="mini">(você)</span>}</span></td>
                    <td className="some-celular mudo">{u.email}</td>
                    <td>{NIVEIS[u.nivel].rotulo}</td>
                    <td className="some-celular">{u.ativo ? "Ativo" : <span className="mudo">Inativo</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {selId === "novo" || sel
          ? <Editor key={selId} eu={eu} usuario={sel} aoFechar={() => setSelId(null)} />
          : <Card className="detalhe"><Vazio>Escolha um usuário para ver ou editar.</Vazio></Card>}
      </div>
    </>
  );
}

function Editor({ eu, usuario, aoFechar }: { eu: Usuario; usuario?: Usuario; aoFechar: () => void }) {
  const niveis = niveisGerenciaveis(eu);
  const editavel = !usuario || (usuario.id !== eu.id && podeGerenciarNivel(eu, usuario.nivel));
  const padrao = (n: Nivel) => PADRAO_POR_NIVEL[n].filter((p) => pode(eu, p));

  const [f, setF] = useState<Omit<Usuario, "id">>(() => usuario ?? {
    nome: "", email: "", telefone: "", nivel: niveis[niveis.length - 1], permissoes: padrao(niveis[niveis.length - 1]), ativo: true,
  });
  const texto = (k: "nome" | "email" | "telefone" | "placa") => ({
    value: f[k] ?? "", disabled: !editavel, onChange: (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value }),
  });
  const alternar = (p: Permissao) =>
    setF({ ...f, permissoes: f.permissoes.includes(p) ? f.permissoes.filter((x) => x !== p) : [...f.permissoes, p] });

  function salvar(e: FormEvent) {
    e.preventDefault();
    acoes.salvarUsuario({ ...f, id: usuario?.id });
    aoFechar();
  }

  return (
    <Card className="detalhe aberto" titulo={usuario ? usuario.nome : "Novo usuário"}
      acao={<Botao icone="fechar" aria-label="Fechar" onClick={aoFechar} />}>
      {!editavel && <p className="mini">Você só pode editar usuários de nível menor que o seu.</p>}
      <form className="formulario" onSubmit={salvar}>
        <label className="campo"><span>Nome</span><input className="entrada" required {...texto("nome")} /></label>
        <label className="campo"><span>E-mail</span><input className="entrada" type="email" required {...texto("email")} /></label>
        <div className="formulario-2">
          <label className="campo"><span>Telefone</span><input className="entrada" {...texto("telefone")} /></label>
          <label className="campo"><span>Nível</span>
            <select className="entrada" value={f.nivel} disabled={!editavel}
              onChange={(e) => { const n = e.target.value as Nivel; setF({ ...f, nivel: n, permissoes: padrao(n) }); }}>
              {(editavel ? niveis : [f.nivel]).map((n) => <option key={n} value={n}>{NIVEIS[n].rotulo}</option>)}
            </select>
          </label>
        </div>
        {f.nivel === "motorista" && <label className="campo"><span>Placa</span><input className="entrada" {...texto("placa")} /></label>}

        <div>
          <p className="card-titulo subtitulo">Permissões</p>
          <div className="permissoes">
            {(Object.keys(PERMISSOES) as Permissao[]).map((p) => (
              <label key={p} className="interruptor">
                <input type="checkbox" checked={f.nivel === "admin" || f.permissoes.includes(p)}
                  disabled={!editavel || f.nivel === "admin" || !pode(eu, p)} onChange={() => alternar(p)} />
                <span>{PERMISSOES[p].rotulo}<br /><span className="mini">{PERMISSOES[p].descricao}</span></span>
              </label>
            ))}
          </div>
        </div>

        <label className="interruptor">
          <input type="checkbox" checked={f.ativo} disabled={!editavel} onChange={() => setF({ ...f, ativo: !f.ativo })} />
          <span>Usuário ativo</span>
        </label>

        {editavel && (
          <div className="acoes">
            <Botao onClick={aoFechar}>Cancelar</Botao>
            <Botao type="submit" variante="destaque" icone="check">Salvar</Botao>
          </div>
        )}
      </form>
    </Card>
  );
}
