/**
 * Níveis de usuário e permissões.
 *
 * - Nível define a HIERARQUIA: quem pode gerenciar quem.
 *   Um usuário só cria/edita usuários de nível MENOR que o dele.
 * - Permissões definem as FUNCIONALIDADES: cada usuário tem 1 ou mais.
 *   Cada nível vem com um padrão, mas dá para ligar/desligar uma a uma.
 *   Ninguém concede uma permissão que não tem.
 */

export const NIVEIS = {
  admin: { peso: 4, rotulo: "Administrador", descricao: "Acesso total ao sistema" },
  gestor: { peso: 3, rotulo: "Gestor", descricao: "Gerencia equipe e confere canhotos" },
  operador: { peso: 2, rotulo: "Operador", descricao: "Faturamento / expedição" },
  motorista: { peso: 1, rotulo: "Motorista", descricao: "Envia canhotos pelo celular" },
} as const;

export type Nivel = keyof typeof NIVEIS;

export const PERMISSOES = {
  ver_todas_nf: { rotulo: "Ver todas as NFs", descricao: "Sem ela, vê só as NFs atribuídas a si" },
  cadastrar_nf: { rotulo: "Cadastrar e editar NF", descricao: "Lançar novas notas e corrigir dados" },
  atribuir_motorista: { rotulo: "Atribuir motorista", descricao: "Definir qual motorista leva a NF" },
  enviar_canhoto: { rotulo: "Enviar canhoto", descricao: "Fotografar ou anexar o canhoto assinado" },
  conferir_canhoto: { rotulo: "Conferir canhoto", descricao: "Aprovar ou recusar a foto enviada" },
  ver_painel: { rotulo: "Ver painel de motoristas", descricao: "Telas Início e Motoristas" },
  exportar: { rotulo: "Exportar relatórios", descricao: "Baixar planilha (CSV) das NFs" },
  gerenciar_usuarios: { rotulo: "Gerenciar usuários", descricao: "Criar usuários de nível menor" },
} as const;

export type Permissao = keyof typeof PERMISSOES;

export const PADRAO_POR_NIVEL: Record<Nivel, Permissao[]> = {
  admin: Object.keys(PERMISSOES) as Permissao[],
  gestor: ["ver_todas_nf", "cadastrar_nf", "atribuir_motorista", "enviar_canhoto", "conferir_canhoto", "ver_painel", "exportar", "gerenciar_usuarios"],
  operador: ["ver_todas_nf", "cadastrar_nf", "atribuir_motorista", "enviar_canhoto", "ver_painel"],
  motorista: ["enviar_canhoto"],
};

type ComAcesso = { nivel: Nivel; permissoes: Permissao[] };

export const pode = (u: ComAcesso | null | undefined, p: Permissao) =>
  !!u && (u.nivel === "admin" || u.permissoes.includes(p));

/** `quem` pode criar/editar alguém do nível `alvo`? */
export const podeGerenciarNivel = (quem: ComAcesso, alvo: Nivel) =>
  pode(quem, "gerenciar_usuarios") && NIVEIS[quem.nivel].peso > NIVEIS[alvo].peso;

export const niveisGerenciaveis = (quem: ComAcesso) =>
  (Object.keys(NIVEIS) as Nivel[]).filter((n) => podeGerenciarNivel(quem, n));
