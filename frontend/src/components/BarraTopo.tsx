/** Barra do topo: data/filial, busca global, avisos e menu do usuário. */
import { useEffect, useRef, useState } from "react";
import { NIVEIS, pode } from "../lib/acesso";
import { definirBusca, useBusca } from "../lib/busca";
import { FILIAL } from "../lib/config";
import { irPara } from "../lib/rota";
import { acoes, useEstado } from "../lib/store";
import type { Usuario } from "../lib/tipos";
import { dataCurta, plural } from "../lib/util";
import { Icone } from "./Icone";
import { Avatar } from "./ui";

export function BarraTopo({ eu }: { eu: Usuario }) {
  const { notas } = useEstado();
  const busca = useBusca();
  const [menu, setMenu] = useState(false);
  const refMenu = useRef<HTMLDivElement>(null);
  const aConferir = pode(eu, "conferir_canhoto") ? notas.filter((n) => n.status === "enviado").length : 0;

  // fecha o menu ao clicar fora
  useEffect(() => {
    if (!menu) return;
    const fora = (e: MouseEvent) => !refMenu.current?.contains(e.target as Node) && setMenu(false);
    addEventListener("mousedown", fora);
    return () => removeEventListener("mousedown", fora);
  }, [menu]);

  // a busca filtra a tela Canhotos; leva até ela sem apagar os filtros que já estão abertos
  function buscar(texto: string) {
    definirBusca(texto);
    if (texto && !location.hash.startsWith("#/canhotos")) irPara("canhotos");
  }

  return (
    <header className="topo">
      <div className="topo-data">
        <span className="mini">{dataCurta()}</span>
        <strong><Icone nome="local" tamanho={12} /> {FILIAL}</strong>
      </div>

      <label className="busca">
        <span className="busca-icone"><Icone nome="busca" tamanho={13} /></span>
        <input className="entrada" type="search" placeholder="Buscar NF, cliente, cidade ou motorista"
          aria-label="Buscar" value={busca} onChange={(e) => buscar(e.target.value)} />
        <span className="busca-icone"><Icone nome="filtro" tamanho={13} /></span>
      </label>

      <div className="topo-direita">
        <button className="botao-redondo topo-sino" data-alerta={aConferir ? "" : undefined} aria-label="Avisos"
          title={aConferir ? plural(aConferir, "canhoto a conferir", "canhotos a conferir") : "Sem avisos"}
          onClick={() => irPara("canhotos", { status: "enviado" })}>
          <Icone nome="sino" tamanho={14} />
        </button>

        <div ref={refMenu} className="topo-menu">
          <button className="topo-usuario" onClick={() => setMenu(!menu)} aria-expanded={menu}>
            <Avatar nome={eu.nome} tamanho={26} />
            <span className="topo-usuario-nome">
              <strong>{eu.nome}</strong>
              <span className="mini">{NIVEIS[eu.nivel].rotulo}</span>
            </span>
            <Icone nome="abaixo" tamanho={14} />
          </button>
          {menu && (
            <div className="menu" role="menu">
              <button role="menuitem" onClick={() => { acoes.restaurarDemo(); setMenu(false); }}>
                <Icone nome="restaurar" /> Restaurar dados de exemplo
              </button>
              <button role="menuitem" onClick={acoes.sair}><Icone nome="sair" /> Sair</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
