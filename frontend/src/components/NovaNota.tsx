/** Formulário de nova nota fiscal (modal). */
import { useState, type FormEvent } from "react";
import { CIDADES } from "../data/seed";
import { pode } from "../lib/acesso";
import { acoes, useEstado } from "../lib/store";
import type { Usuario } from "../lib/tipos";
import { hojeISO } from "../lib/util";
import { Botao, Modal } from "./ui";

export function NovaNota({ eu, aoFechar }: { eu: Usuario; aoFechar: () => void }) {
  const { usuarios, notas } = useEstado();
  const motoristas = usuarios.filter((u) => u.nivel === "motorista" && u.ativo);
  const proximo = String(Math.max(0, ...notas.map((n) => Number(n.numero) || 0)) + 1).padStart(6, "0");

  const [f, setF] = useState({ numero: proximo, serie: "1", cliente: "", cidade: "", valor: "", emissao: hojeISO(), motoristaId: "" });
  const mudar = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  function salvar(e: FormEvent, fechar: () => void) {
    e.preventDefault();
    acoes.salvarNota({
      ...f, valor: Number(f.valor.replace(",", ".")) || 0, motoristaId: f.motoristaId || null,
      status: "pendente", observacao: "",
    });
    fechar();
  }

  return (
    <Modal titulo="Nova nota fiscal" aoFechar={aoFechar}>{(fechar) => (
      <form className="formulario" onSubmit={(e) => salvar(e, fechar)}>
        <div className="formulario-2">
          <label className="campo"><span>Número</span><input className="entrada" required value={f.numero} onChange={mudar("numero")} /></label>
          <label className="campo"><span>Série</span><input className="entrada" required value={f.serie} onChange={mudar("serie")} /></label>
        </div>
        <label className="campo"><span>Cliente</span><input className="entrada" required autoFocus value={f.cliente} onChange={mudar("cliente")} /></label>
        <div className="formulario-2">
          <label className="campo"><span>Cidade</span>
            <input className="entrada" required list="cidades" value={f.cidade} onChange={mudar("cidade")} />
            <datalist id="cidades">{Object.keys(CIDADES).map((c) => <option key={c} value={c} />)}</datalist>
          </label>
          <label className="campo"><span>Valor (R$)</span><input className="entrada" required inputMode="decimal" value={f.valor} onChange={mudar("valor")} /></label>
        </div>
        <div className="formulario-2">
          <label className="campo"><span>Emissão</span><input className="entrada" type="date" required value={f.emissao} onChange={mudar("emissao")} /></label>
          {pode(eu, "atribuir_motorista") && (
            <label className="campo"><span>Motorista</span>
              <select className="entrada" value={f.motoristaId} onChange={mudar("motoristaId")}>
                <option value="">Sem motorista</option>
                {motoristas.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </label>
          )}
        </div>
        <div className="acoes">
          <Botao onClick={fechar}>Cancelar</Botao>
          <Botao type="submit" variante="destaque" icone="check">Salvar nota</Botao>
        </div>
      </form>
    )}</Modal>
  );
}
