import type { CSSProperties } from "react";
import logoV from "../assets/void-v.png";
import { irPara, type Tela } from "../lib/rota";
import { acoes } from "../lib/store";
import { Icone, type NomeIcone } from "./Icone";

export type ItemMenu = { id: Tela; rotulo: string; icone: NomeIcone };

/**
 * Logo (em cima) e Sair (embaixo) ficam soltos no fundo; só os itens do menu
 * ficam no card do meio. A barra branca desliza até o item ativo (via --i no CSS).
 */
export function BarraLateral({ itens, atual }: { itens: ItemMenu[]; atual: Tela }) {
  const indice = Math.max(0, itens.findIndex((i) => i.id === atual));
  return (
    <nav className="lateral" aria-label="Menu principal">
      <img className="logo-v lateral-logo" src={logoV} alt="VOID" />

      <div className="lateral-card">
        <div className="lateral-nav" style={{ "--i": indice } as CSSProperties}>
          <span className="lateral-indicador" aria-hidden="true" />
          {itens.map((i) => (
            <button key={i.id} className={`lateral-item ${i.id === atual ? "ativo" : ""}`}
              title={i.rotulo} aria-label={i.rotulo} aria-current={i.id === atual ? "page" : undefined}
              onClick={() => irPara(i.id)}>
              <Icone nome={i.icone} tamanho={16} />
            </button>
          ))}
        </div>
      </div>

      <button className="lateral-item lateral-sair" title="Sair" aria-label="Sair" onClick={acoes.sair}>
        <Icone nome="sair" tamanho={16} />
      </button>
    </nav>
  );
}
