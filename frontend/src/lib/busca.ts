/** Texto da busca global (barra superior). A tela Canhotos filtra por ele. */
import { useSyncExternalStore } from "react";

let texto = "";
const ouvintes = new Set<() => void>();

export const definirBusca = (t: string) => { texto = t; ouvintes.forEach((f) => f()); };
export const useBusca = () => useSyncExternalStore((f) => (ouvintes.add(f), () => ouvintes.delete(f)), () => texto);
