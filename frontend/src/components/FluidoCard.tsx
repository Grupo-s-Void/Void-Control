/**
 * Card com fluido interativo (WebGL): faixa de luz branca desfocada com grão sobre
 * preto, como na referência. O mouse empurra e dobra o fluido; ao sair, ele volta
 * a derivar sozinho. Só preto/cinza/branco. Sem WebGL, cai num gradiente CSS.
 */
import { useEffect, useRef } from "react";
import logoV from "../assets/void-v.png";

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uT;
uniform vec2 uM;      // mouse suavizado (0..1, y para cima)
uniform vec2 uV;      // velocidade suavizada do mouse
uniform float uA;     // 0..1 presença do mouse

float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float ns(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hs(i);
  float b = hs(i + vec2(1.0, 0.0));
  float c = hs(i + vec2(0.0, 1.0));
  float d = hs(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
  float s = 0.0;
  float a = 0.55;
  for (int i = 0; i < 3; i++){ s += a * ns(p); p = p * 2.03 + 3.1; a *= 0.45; }
  return s;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(asp, 1.0);
  vec2 m = (uM - 0.5) * vec2(asp, 1.0);

  // o mouse empurra o fluido e acende uma luz onde passa
  vec2 d = p - m;
  float r2 = dot(d, d);
  float push = exp(-r2 * 6.0) * uA;
  p += d * push * 0.5 + uV * push * 1.6;

  float t = uT * 0.07;
  vec2 q = vec2(fbm(p * 1.1 + vec2(t, 0.0)), fbm(p * 1.1 + vec2(5.2, 1.3 - t)));
  float f = fbm(p * 0.95 + q * 1.5 + vec2(0.0, t * 0.6));
  float lum = smoothstep(0.17, 0.60, f);
  lum = lum * lum * (3.0 - 2.0 * lum);
  lum += push * 0.18 * (1.0 - lum);

  vec3 preto = vec3(0.012, 0.014, 0.013);
  vec3 medio = vec3(0.34, 0.35, 0.34);
  vec3 claro = vec3(0.93, 0.91, 0.86);
  vec3 col = mix(preto, medio, smoothstep(0.0, 0.5, lum));
  col = mix(col, claro, smoothstep(0.45, 0.95, lum));

  // vinheta leve nas bordas
  col *= mix(0.55, 1.0, smoothstep(1.15, 0.2, length((uv - 0.5) * vec2(1.0, 1.1))));

  // textura de areia: grão fino + grão médio, fixo (não pisca), mais forte nos meios-tons
  vec2 fc = gl_FragCoord.xy;
  float g = (hs(fc) - 0.5) * 0.75 + (hs(floor(fc * 0.5) + 17.0) - 0.5) * 0.55;
  float amp = 0.07 + 0.11 * (1.0 - abs(lum - 0.5) * 1.5);
  col += g * amp;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

export function FluidoCard({ className = "", logo = true }: { className?: string; logo?: boolean }) {
  const caixa = useRef<HTMLDivElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = tela.current!;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) { caixa.current?.classList.add("sem-gl"); return; }

    const compilar = (tipo: number, src: string) => {
      const s = gl.createShader(tipo)!;
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn("FluidoCard shader:", gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compilar(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { caixa.current?.classList.add("sem-gl"); return; }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uT = gl.getUniformLocation(prog, "uT");
    const uM = gl.getUniformLocation(prog, "uM");
    const uV = gl.getUniformLocation(prog, "uV");
    const uA = gl.getUniformLocation(prog, "uA");

    // render em resolução reduzida: o grão fica mais "grosso", como na referência, e custa pouco
    const redimensionar = () => {
      const dpr = 1;
      const w = Math.max(2, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(2, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    };
    const ro = new ResizeObserver(redimensionar);
    ro.observe(canvas);
    redimensionar();

    // mouse
    const alvo = { x: 0.5, y: 0.5, a: 0 };
    const atual = { x: 0.5, y: 0.5, a: 0, vx: 0, vy: 0 };
    const mover = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      alvo.x = (e.clientX - r.left) / r.width;
      alvo.y = 1 - (e.clientY - r.top) / r.height;
      alvo.a = 1;
    };
    const sair = () => { alvo.a = 0; };
    const el = caixa.current!;
    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerdown", mover);
    el.addEventListener("pointerleave", sair);

    const parado = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, ultimo = performance.now(), tempo = 20, visivel = true;
    const io = new IntersectionObserver(([en]) => { visivel = en.isIntersecting; });
    io.observe(el);

    const quadro = (agora: number) => {
      raf = requestAnimationFrame(quadro);
      if (!visivel || document.hidden) { ultimo = agora; return; }
      const dt = Math.min(0.05, (agora - ultimo) / 1000);
      ultimo = agora;
      if (!parado) tempo += dt;

      const k = 1 - Math.pow(0.0006, dt); // suavização independente de fps
      const px = atual.x, py = atual.y;
      atual.x += (alvo.x - atual.x) * k;
      atual.y += (alvo.y - atual.y) * k;
      atual.a += (alvo.a - atual.a) * (1 - Math.pow(0.02, dt));
      const kv = 1 - Math.pow(0.002, dt);
      atual.vx += ((atual.x - px) / Math.max(dt, 1e-3) * 0.12 - atual.vx) * kv;
      atual.vy += ((atual.y - py) / Math.max(dt, 1e-3) * 0.12 - atual.vy) * kv;

      gl.uniform1f(uT, tempo);
      gl.uniform2f(uM, atual.x, atual.y);
      gl.uniform2f(uV, atual.vx, atual.vy);
      gl.uniform1f(uA, atual.a);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(quadro);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerdown", mover);
      el.removeEventListener("pointerleave", sair);
    };
  }, []);

  return (
    <div ref={caixa} className={`fluido-card ${className}`} aria-hidden="true">
      <canvas ref={tela} />
      {logo && <img className="fluido-logo" src={logoV} alt="" draggable={false} />}
    </div>
  );
}
