/**
 * Monta o app: sem sessão → tela Entrar; com sessão → barra lateral,
 * barra do topo e a tela atual (definida pelo endereço, ver lib/rota.ts).
 */
import "./styles/global.css";
import { useEffect } from "react";
import { BarraLateral, type ItemMenu } from "./components/BarraLateral";
import { BarraTopo } from "./components/BarraTopo";
import { pode, type Permissao } from "./lib/acesso";
import { SISTEMA } from "./lib/config";
import { useRota } from "./lib/rota";
import { erroArmazenamento, useUsuarioAtual } from "./lib/store";
import Canhotos from "./pages/Canhotos";
import Entrar from "./pages/Entrar";
import Inicio from "./pages/Inicio";
import Motoristas from "./pages/Motoristas";
import Usuarios from "./pages/Usuarios";

/** Telas do menu e a permissão que cada uma exige. */
const MENU: (ItemMenu & { permissao?: Permissao })[] = [
  { id: "inicio", rotulo: "Início", icone: "inicio", permissao: "ver_painel" },
  { id: "canhotos", rotulo: "Canhotos", icone: "canhoto" },
  { id: "motoristas", rotulo: "Motoristas", icone: "caminhao", permissao: "ver_painel" },
  { id: "usuarios", rotulo: "Usuários", icone: "usuarios", permissao: "gerenciar_usuarios" },
];

export default function App() {
  const eu = useUsuarioAtual();
  const { tela } = useRota();
  const itens = eu ? MENU.filter((i) => !i.permissao || pode(eu, i.permissao)) : [];
  const item = itens.find((i) => i.id === tela) ?? itens[0];

  // nome na aba do navegador: "Canhotos · VOID Control" (a tela Entrar define o dela)
  useEffect(() => { if (item) document.title = `${item.rotulo} · ${SISTEMA}`; }, [item]);

  if (!eu || !item) return <Entrar />;
  const atual = item.id;
  // logo após o login, o app abre a partir do pontinho ciano (ver Entrar.tsx)
  const portal = document.documentElement.dataset.portal === "1";

  return (
    <div className={`app ${portal ? "portal" : ""}`}
      onAnimationEnd={(e) => e.animationName === "portal" && delete document.documentElement.dataset.portal}>
      <BarraLateral itens={itens} atual={atual} />
      <div className="app-corpo">
        <BarraTopo eu={eu} />
        {erroArmazenamento && <p className="aviso">{erroArmazenamento}</p>}
        <main className="app-tela">
          {/* key: a tela nova surge com um fade curto */}
          <div key={atual} className="tela">
            {atual === "inicio" && <Inicio eu={eu} />}
            {atual === "canhotos" && <Canhotos eu={eu} />}
            {atual === "motoristas" && <Motoristas />}
            {atual === "usuarios" && <Usuarios eu={eu} />}
          </div>
        </main>
      </div>
    </div>
  );
}
