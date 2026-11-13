/**
 * Tela de login (SIMULADO): card de vidro escuro sobre preto com luz branca
 * desfocada e grão, e a frase "focus on void" no canto inferior direito.
 * Qualquer usuário ativo entra com o próprio e-mail + SENHA_DEMO (lib/config.ts).
 */
import { useEffect, useState, type FormEvent } from "react";
import { FluidoCard } from "../components/FluidoCard";
import { Icone } from "../components/Icone";
import { Avatar } from "../components/ui";
import { NIVEIS } from "../lib/acesso";
import { LOGIN_PADRAO, SENHA_DEMO, SISTEMA } from "../lib/config";
import { acoes, useEstado } from "../lib/store";
import { normalizar, primeiroNome } from "../lib/util";

/* ---------- Transição para o sistema ----------
 * 1) o card se fecha e a luz do fundo brilha e se expande (CSS .entrar.saindo);
 * 2) aparece "Bem-vindo, Fulano" sobre a luz;
 * 3) tudo some (.fim) e o app surge com um fade (data-abrindo avisa o App).
 */
const FECHA_MS = 2400; // quando começa a sumir
const FADE_MS = 450;   // duração do sumiço, antes de abrir o app

export default function Entrar() {
  const { usuarios } = useEstado();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [fim, setFim] = useState(false);
  const [boasVindas, setBoasVindas] = useState("");

  useEffect(() => { document.title = `Entrar · ${SISTEMA}`; }, []);

  // perfis de teste: um de cada nível
  const exemplos = (Object.keys(NIVEIS) as (keyof typeof NIVEIS)[])
    .map((n) => usuarios.find((u) => u.nivel === n && u.ativo))
    .filter((u) => !!u);

  function preencher(e: string) {
    setEmail(e); setSenha(SENHA_DEMO); setErro("");
  }

  function entrar(e: FormEvent) {
    e.preventDefault();
    if (entrando) return;
    const u = usuarios.find((x) => normalizar(x.email) === normalizar(email));
    if (!u || senha !== SENHA_DEMO) return setErro("E-mail ou senha incorretos.");
    if (!u.ativo) return setErro("Este usuário está inativo. Fale com o administrador.");
    setErro("");
    setEntrando(true);
    setBoasVindas(primeiroNome(u.nome));
    setTimeout(() => setFim(true), FECHA_MS);
    setTimeout(() => {
      document.documentElement.dataset.abrindo = "1";
      acoes.entrar(u.id);
    }, FECHA_MS + FADE_MS);
  }

  return (
    <main className={`entrar ${entrando ? "saindo" : ""} ${fim ? "fim" : ""}`}>
      <div className="brilho" aria-hidden="true"><i /><i /></div>
      <div className="entrar-luz" aria-hidden="true" />
      {entrando && (
        <div className="entrar-bv" role="status">
          <small>Bem-vindo,</small>
          <strong>{boasVindas}</strong>
        </div>
      )}

      <div className="entrar-palco">
      <form className="entrar-caixa" onSubmit={entrar} noValidate>
        <div className="entrar-cabeca">
          <h1>Acesse sua conta</h1>
          <Icone nome="cadeado" tamanho={15} />
        </div>

        <label className="entrar-campo">
          <span className="entrar-rotulo">E-mail <small>corporativo</small></span>
          <span className="entrar-caixinha">
            <Icone nome="email" tamanho={14} />
            <input type="email" autoComplete="username" autoFocus required
              placeholder="nome@voidlog.com.br" value={email}
              onChange={(e) => { setEmail(e.target.value); setErro(""); }} />
          </span>
        </label>

        <label className="entrar-campo">
          <span className="entrar-rotulo">Senha</span>
          <span className="entrar-caixinha">
            <Icone nome="cadeado" tamanho={14} />
            <input type={verSenha ? "text" : "password"} autoComplete="current-password" required
              placeholder="••••••" value={senha}
              onChange={(e) => { setSenha(e.target.value); setErro(""); }} />
            <button type="button" className="entrar-ver" aria-label={verSenha ? "Esconder senha" : "Mostrar senha"}
              onClick={() => setVerSenha(!verSenha)}>
              {verSenha ? "Ocultar" : "Mostrar"}
            </button>
          </span>
        </label>

        <p className="entrar-divisa"><span>Demonstração · {LOGIN_PADRAO} · senha {SENHA_DEMO}</span></p>

        {erro && <p className="entrar-erro" role="alert">{erro}</p>}

        <button type="submit" className="entrar-botao" disabled={entrando || !email || !senha}>
          {entrando ? "Entrando…" : "Entrar"}
        </button>

        <ul className="entrar-perfis" aria-label="Perfis de teste">
          {exemplos.map((u) => (
            <li key={u.id}>
              <button type="button" className={email === u.email ? "ativo" : ""}
                onClick={() => preencher(u.email)} title={`Preencher login de ${u.nome}`}>
                <span className="entrar-perfil-nome"><Avatar nome={u.nome} tamanho={18} />{NIVEIS[u.nivel].rotulo}</span>
                <span className="entrar-perfil-email">{u.email}</span>
              </button>
            </li>
          ))}
        </ul>
      </form>
      <FluidoCard />
      </div>

      <p className="entrar-focus" aria-label="focus on void">
        <span data-t="focus on void" aria-hidden="true">focus on void</span>
      </p>
    </main>
  );
}
