/**
 * Textura dither (Bayer 4×4): cada célula acende ou não comparando o brilho com a
 * matriz — é o grão "halftone" da identidade. Usada grande no céu da tela Entrar e
 * pequena em detalhes do app (estado vazio, foto do motorista). Sempre desenhada
 * UMA VEZ num canvas, nunca por quadro.
 */
import { useEffect, useRef } from "react";

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Limiar da célula (coluna, linha) da grade, entre 0 e 1. */
export function limiar(col: number, lin: number) {
  return (BAYER4[lin & 3][col & 3] + 0.5) / 16;
}

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Ruído suave (value noise) com 3 oitavas — dá forma orgânica a mares da lua e nuvens. */
export function ruido(x: number, y: number) {
  let total = 0, peso = 0.6, escala = 1;
  for (let i = 0; i < 3; i++) {
    const xs = x * escala, ys = y * escala;
    const xi = Math.floor(xs), yi = Math.floor(ys);
    const xf = xs - xi, yf = ys - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    total += (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * peso;
    peso /= 2; escala *= 2.1;
  }
  return total / 0.975;
}

/** Brilho de um ponto na esfera da lua (nx, ny entre -1 e 1); null fora do disco. */
export function brilhoLua(nx: number, ny: number) {
  const d2 = nx * nx + ny * ny;
  if (d2 > 1) return null;
  const z = Math.sqrt(1 - d2);
  const luz = Math.max(0, nx * -0.42 + ny * -0.32 + z * 0.85); // luz vindo de cima/esquerda
  const mar = ruido(nx * 1.8 + 4, ny * 1.8 + 9);
  const escuro = Math.min(1, Math.max(0, (mar - 0.5) / 0.18)) * 0.4;
  return (0.3 + luz * 0.7) * (1 - escuro);
}

/** Lua pequena em dither — usada no estado vazio. */
export function LuaPixel({ tamanho = 44 }: { tamanho?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = tamanho * dpr; canvas.height = tamanho * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#e6e9f0";

    const passo = 3, raio = tamanho / 2 - 1;
    for (let lin = 0; lin * passo < tamanho; lin++) {
      for (let col = 0; col * passo < tamanho; col++) {
        const b = brilhoLua((col * passo + 1 - tamanho / 2) / raio, (lin * passo + 1 - tamanho / 2) / raio);
        if (b !== null && b > limiar(col, lin)) ctx.fillRect(col * passo, lin * passo, 2, 2);
      }
    }
  }, [tamanho]);

  return <canvas ref={ref} className="lua-pixel" style={{ width: tamanho, height: tamanho }} aria-hidden="true" />;
}

/** Brilho radial em dither que preenche o elemento pai (fundo da foto do motorista). */
export function BrilhoDither({ cor }: { cor: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;

    function desenhar() {
      const { width: w, height: h } = canvas.getBoundingClientRect();
      if (!w || !h) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = cor;

      const passo = 4, cx = w / 2, cy = h * 0.32, alcance = Math.max(w, h) * 0.62;
      for (let lin = 0; lin * passo < h; lin++) {
        for (let col = 0; col * passo < w; col++) {
          const d = Math.hypot(col * passo - cx, lin * passo - cy) / alcance;
          const b = Math.max(0, 1 - d) ** 1.8 * 0.7;
          if (b > limiar(col, lin)) ctx.fillRect(col * passo, lin * passo, 2, 2);
        }
      }
    }

    desenhar();
    const obs = new ResizeObserver(desenhar);
    obs.observe(canvas);
    return () => obs.disconnect();
  }, [cor]);

  return <canvas ref={ref} className="brilho-dither" aria-hidden="true" />;
}
