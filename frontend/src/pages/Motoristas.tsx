/** Tela Motoristas — um card por motorista: sinal, notas em aberto e % conferido. */
import { Icone } from "../components/Icone";
import { Anel, Botao, Cabecalho, Card, FotoMotorista, Vazio } from "../components/ui";
import { abertasDe, atrasadasDe, notasDe, offline, ordenarMotoristas, progressoDe } from "../lib/frota";
import { irPara } from "../lib/rota";
import { useEstado } from "../lib/store";
import type { Usuario } from "../lib/tipos";
import { haQuanto, plural } from "../lib/util";

const sinal = (m: Usuario) =>
  !m.local ? "Sem posição" : `${m.local.cidade} · ${offline(m) ? "sem sinal " : ""}${haQuanto(m.local.em)}`;

export default function Motoristas() {
  const { usuarios, notas } = useEstado();
  const motoristas = ordenarMotoristas(usuarios.filter((u) => u.nivel === "motorista" && u.ativo));
  const semSinal = motoristas.filter(offline).length;

  return (
    <>
      <Cabecalho titulo={<>Frota · <b>motoristas</b></>} subtitulo={`${motoristas.length - semSinal} com sinal · ${semSinal} sem sinal`} />

      {motoristas.length === 0 && <Vazio>Nenhum motorista ativo. Cadastre um em Usuários.</Vazio>}
      <div className="rolagem">
        <div className="grade-cards entra">
          {motoristas.map((m) => (
            <Card key={m.id} className={`motorista ${offline(m) ? "sem-sinal" : ""}`}>
              <FotoMotorista nome={m.nome}>
                <div>
                  <strong className="corta">{m.nome}</strong>
                  <span className="mini">{m.placa}</span>
                </div>
                <a className="botao-redondo" href={`tel:${m.telefone}`} aria-label={`Ligar para ${m.nome}`}><Icone nome="telefone" tamanho={12} /></a>
              </FotoMotorista>

              <p className="mini motorista-local"><Icone nome="local" tamanho={12} />{sinal(m)}</p>

              <div className="motorista-numeros">
                <div><strong className="num">{abertasDe(m.id, notas).length}</strong><span className="mini">Em aberto</span></div>
                <div><strong className="num">{atrasadasDe(m.id, notas).length}</strong><span className="mini">Atrasadas</span></div>
                <Anel valor={progressoDe(m.id, notas)} tamanho={40} />
              </div>

              <Botao variante="contorno" icone="canhoto" onClick={() => irPara("canhotos", { motorista: m.id })}>
                Ver {plural(notasDe(m.id, notas).length, "nota")}
              </Botao>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
