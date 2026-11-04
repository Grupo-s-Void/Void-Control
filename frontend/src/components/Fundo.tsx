/**
 * Fundo único do sistema (login e app): uma constelação em espiral, pixelizada.
 * Canvas fixo atrás de tudo, desenhado UMA VEZ (e de novo só no resize); a deriva
 * lenta é CSS. No login aparece mais forte; depois de entrar fica apagado (.suave),
 * e como o mesmo canvas continua montado, a troca é só um fade de opacidade.
 */
import { useEffect, useRef } from "react";

const GRADE = 4; // todo grão cai nessa grade — é o que deixa a poeira "pixelizada"

/** Núcleo da espiral — também é o ponto de onde o app abre no portal (Entrar.tsx). */
export function pivo() {
  return { x: innerWidth * 0.63, y: innerHeight * 0.32 };
}

const encaixe = (v: number) => Math.round(v / GRADE) * GRADE;

function desenhar(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const { x: px, y: py } = pivo();
  const n = w < 700 ? 200 : 420;
  const raio = Math.max(w, h) * 0.62;

  for (let i = 0; i < n; i++) {
    const t = i / n; // 0 = núcleo, 1 = grão solto na borda
    const angulo = t * 2.6 * Math.PI * 2 + (Math.random() - 0.5) * 0.9;
    const r = raio * t ** 0.62 * (0.85 + Math.random() * 0.3);
    const x = encaixe(px + Math.cos(angulo) * r);
    const y = encaixe(py + Math.sin(angulo) * r * 0.62); // achatado — lê como galáxia vista de lado
    const lado = t < 0.18 && Math.random() < 0.5 ? 4 : 2;
    const alfa = Math.max(0.05, (1 - t) * 0.85) * (0.5 + Math.random() * 0.6);
    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, alfa)})`;
    ctx.fillRect(x, y, lado, lado);
  }

  // estrelas soltas pelo resto da tela; as três primeiras ganham brilho em cruz
  const soltas = w < 700 ? 40 : 80;
  for (let i = 0; i < soltas; i++) {
    const x = encaixe(Math.random() * w), y = encaixe(Math.random() * h);
    ctx.fillStyle = `rgba(255,255,255,${i < 3 ? 0.7 : 0.08 + Math.random() * 0.32})`;
    ctx.fillRect(x, y, 2, 2);
    if (i < 3) {
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      for (const [dx, dy] of [[-4, 0], [4, 0], [0, -4], [0, 4]]) ctx.fillRect(x + dx, y + dy, 2, 2);
    }
  }
}

export function FundoEstelar({ suave }: { suave: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    function pintar() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const w = innerWidth, h = innerHeight;
      const { x, y } = pivo();
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      canvas.style.setProperty("--px", `${x}px`);
      canvas.style.setProperty("--py", `${y}px`);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      desenhar(ctx, w, h);
    }
    pintar();
    let t: number;
    const aoRedimensionar = () => { clearTimeout(t); t = window.setTimeout(pintar, 150); };
    addEventListener("resize", aoRedimensionar);
    return () => { removeEventListener("resize", aoRedimensionar); clearTimeout(t); };
  }, []);

  return <canvas ref={ref} className={`fundo-estelar ${suave ? "suave" : ""}`} aria-hidden="true" />;
}
