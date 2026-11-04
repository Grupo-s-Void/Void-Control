/**
 * Tela de login (SIMULADO) no estilo da homepage da VOID.
 * Qualquer usuário ativo entra com o próprio e-mail + SENHA_DEMO (lib/config.ts).
 */
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { pivo } from "../components/Fundo";
import { Icone } from "../components/Icone";
import { Avatar, Botao } from "../components/ui";
import { NIVEIS } from "../lib/acesso";
import { EMPRESA, LOGIN_PADRAO, SENHA_DEMO, SISTEMA } from "../lib/config";
import { acoes, useEstado } from "../lib/store";
import { normalizar } from "../lib/util";

/* ---------- Transição "portal" para o sistema ----------
 * Ao entrar: o login se dissolve e o núcleo da constelação acende (CSS .entrar.saindo);
 * depois o app abre num círculo que cresce a partir desse ponto (CSS .app.portal).
 * A posição vai em --ox/--oy no <html>; data-portal avisa o App. O fundo
 * (<FundoEstelar>), o núcleo e o portal usam o mesmo pivo().
 */
const SAIDA_MS = 520;

function abrirPortal() {
  const { x, y } = pivo();
  const raiz = document.documentElement;
  raiz.style.setProperty("--ox", `${x}px`);
  raiz.style.setProperty("--oy", `${y}px`);
  raiz.dataset.portal = "1";
}

export default function Entrar() {
  const { usuarios } = useEstado();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [nucleo] = useState(pivo);

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
    const u = usuarios.find((x) => normalizar(x.email) === normalizar(email));
    if (!u || senha !== SENHA_DEMO) return setErro("E-mail ou senha incorretos.");
    if (!u.ativo) return setErro("Este usuário está inativo. Fale com o administrador.");
    setErro("");
    setEntrando(true);
    abrirPortal();
    setTimeout(() => acoes.entrar(u.id), SAIDA_MS);
  }

  return (
    <main className={`entrar ${entrando ? "saindo" : ""}`}>
      <span className="poeira-ponto" aria-hidden="true"
        style={{ "--px": `${nucleo.x}px`, "--py": `${nucleo.y}px` } as CSSProperties} />

      <header className="entrar-topo">
        <span className="logotipo">VOID</span>
        <span className="espacado">Control</span>
      </header>

      <div className="entrar-lados espacado" aria-hidden="true">
        <span>Notas</span><span>Canhotos</span><span>Entregas</span>
      </div>

      <div className="entrar-corpo">
        <div className="entrar-texto">
          <h1>Controle que<br />acompanha cada<br /><b>entrega.</b></h1>
          <p>Canhotos, motoristas e notas fiscais da {EMPRESA} em um só lugar — do envio da foto à conferência.</p>
        </div>

        <form className="card entrar-caixa" onSubmit={entrar} noValidate>
          <div>
            <h2>Acesse sua conta</h2>
            <p className="mini">Use seu e-mail corporativo.</p>
          </div>

          <label className="campo"><span>E-mail</span>
            <input className="entrada" type="email" autoComplete="username" autoFocus required
              placeholder="nome@voidlog.com.br" value={email} onChange={(e) => { setEmail(e.target.value); setErro(""); }} />
          </label>
          <label className="campo"><span>Senha</span>
            <span className="entrada-icone">
              <input className="entrada" type={verSenha ? "text" : "password"} autoComplete="current-password" required
                placeholder="••••••" value={senha} onChange={(e) => { setSenha(e.target.value); setErro(""); }} />
              <button type="button" aria-label={verSenha ? "Esconder senha" : "Mostrar senha"} onClick={() => setVerSenha(!verSenha)}>
                <Icone nome={verSenha ? "olhoFechado" : "olho"} tamanho={14} />
              </button>
            </span>
          </label>

          {erro && <p className="motivo" role="alert">{erro}</p>}

          <Botao type="submit" variante="destaque" disabled={entrando || !email || !senha}>
            {entrando ? "Entrando…" : <>Entrar <Icone nome="seta" tamanho={14} /></>}
          </Botao>

          <div className="entrar-demo">
            <p className="mini"><Icone nome="cadeado" tamanho={11} /> Demonstração — login padrão: <b>{LOGIN_PADRAO}</b> · senha <b>{SENHA_DEMO}</b></p>
            <div className="entrar-perfis">
              {exemplos.map((u) => (
                <button type="button" key={u.id} className={`perfil ${email === u.email ? "ativo" : ""}`}
                  onClick={() => preencher(u.email)} title={`Preencher login de ${u.nome}`}>
                  <Avatar nome={u.nome} tamanho={22} />
                  <span>{NIVEIS[u.nivel].rotulo}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
