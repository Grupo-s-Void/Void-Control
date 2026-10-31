/**
 * Tela de login (SIMULADO) no estilo da homepage da VOID.
 * Qualquer usuário ativo entra com o próprio e-mail + SENHA_DEMO (lib/config.ts).
 */
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Icone } from "../components/Icone";
import { Avatar, Botao } from "../components/ui";
import { NIVEIS } from "../lib/acesso";
import { EMPRESA, LOGIN_PADRAO, SENHA_DEMO, SISTEMA } from "../lib/config";
import { acoes, useEstado } from "../lib/store";
import { normalizar } from "../lib/util";

/* ---------- Transição "portal" para o sistema ----------
 * Ao entrar: o login se dissolve, a poeira é "sugada" para o pontinho ciano (CSS .entrar.saindo);
 * depois o app abre num círculo que cresce a partir desse ponto (CSS .app.portal).
 * A posição vai em --ox/--oy no <html>; data-portal avisa o App. É o mesmo ponto onde
 * o vórtice de poeira (<Poeira>) fica ancorado, calculado pela mesma fórmula nos dois lugares.
 */
const SAIDA_MS = 520;

function pivo() {
  return { x: innerWidth * 0.63, y: innerHeight * 0.32 };
}

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
      <Poeira />

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

/* ---------- Poeira: vórtice de partículas no fundo do login ----------
 * Desenhado UMA VEZ num <canvas> (não recalculado por quadro) — por isso é leve.
 * O movimento de "deriva" e a saída (poeira sugada pro ponto) são só CSS (transform/opacity),
 * então rodam na GPU sem JS a cada frame.
 */
const PARTICULAS_DESKTOP = 320;
const PARTICULAS_CELULAR = 150;

function Poeira() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [{ x: px, y: py }] = useState(pivo); // fixo no mount: a deriva gira em torno de um ponto estável

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;

    function desenhar() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const w = innerWidth, h = innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const n = w < 700 ? PARTICULAS_CELULAR : PARTICULAS_DESKTOP;
      const raio = Math.max(w, h) * 0.62;
      const voltas = 2.6;

      for (let i = 0; i < n; i++) {
        const t = i / n; // 0 = núcleo do vórtice, 1 = poeira solta na borda
        const angulo = t * voltas * Math.PI * 2 + (Math.random() - 0.5) * 0.9;
        const r = raio * t ** 0.62 * (0.85 + Math.random() * 0.3);
        const x = px + Math.cos(angulo) * r;
        const y = py + Math.sin(angulo) * r * 0.62; // achatado — lê como funil, não um círculo
        const tamanho = Math.max(0.4, (1 - t) * 2.6) * (0.5 + Math.random());
        const alfa = Math.max(0.03, (1 - t) * 0.8) * (0.5 + Math.random() * 0.7);
        // núcleo ciano (mesma cor de destaque do sistema), poeira mais distante esbranquiçada
        ctx.fillStyle = t < 0.35 ? `rgba(143,220,232,${alfa})` : `rgba(255,255,255,${alfa * 0.8})`;
        ctx.beginPath();
        ctx.arc(x, y, tamanho, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    desenhar();
    let t: number;
    const aoRedimensionar = () => { clearTimeout(t); t = window.setTimeout(desenhar, 150); };
    addEventListener("resize", aoRedimensionar);
    return () => { removeEventListener("resize", aoRedimensionar); clearTimeout(t); };
  }, [px, py]);

  return (
    <div className="entrar-poeira" style={{ "--px": `${px}px`, "--py": `${py}px` } as CSSProperties} aria-hidden="true">
      <canvas ref={ref} className="poeira-tela" />
      <span className="poeira-ponto" />
    </div>
  );
}
