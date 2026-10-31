/**
 * Navegação entre telas pelo endereço: #/canhotos?status=enviado
 * Assim o F5 e o botão "voltar" do navegador funcionam.
 */
import { useSyncExternalStore } from "react";

export type Tela = "inicio" | "canhotos" | "motoristas" | "usuarios";

const ler = () => location.hash;

export function useRota() {
  const hash = useSyncExternalStore(
    (f) => (addEventListener("hashchange", f), () => removeEventListener("hashchange", f)),
    ler,
  );
  const [caminho, busca = ""] = hash.replace(/^#\/?/, "").split("?");
  return { tela: caminho as Tela | "", params: new URLSearchParams(busca) };
}

export function irPara(tela: Tela, params: Record<string, string | undefined> = {}) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && p.set(k, v));
  const q = p.toString();
  location.hash = `/${tela}${q ? `?${q}` : ""}`;
}
