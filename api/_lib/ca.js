// Apoio da Central Administrativa: as 4 áreas (ambientes) e a regra de quem lê e grava cada coleção.
export const AREAS_CA = ["financeiro", "patrimonio", "atendimento", "ti"];

// Coleção do banco → área dona dela. "admin" = só o administrador; "comum" = qualquer pessoa com acesso à Central.
const DONO = {
  hlan: "financeiro", loc_imv: "financeiro", loc_link: "financeiro", cfg: "financeiro", partes: "financeiro",
  fc_at: "atendimento",
  ti_notas: "ti", ti_cfg: "ti", ti_aquis: "ti",
  eqp: "financeiro",   // Produtividade da equipe: só o administrador e quem tem a chave em Usuários (u.eqp, ver abaixo)
  sug: "comum", faq: "comum"
};
export const colecaoValida = col => Object.prototype.hasOwnProperty.call(DONO, col);

// Tem acesso a pelo menos uma área da Central?
export const temCentral = u => !!u.admin || AREAS_CA.some(a => u.modulos[a]);

// Pode LER a coleção? (sug: cada um lê só a sua; isso é filtrado na rota)
export function podeLer(u, col) {
  const d = DONO[col];
  if (u.admin) return true;
  if (d === "admin") return false;
  if (col === "eqp") return !!u.eqp;
  if (d === "comum") return temCentral(u);
  return !!u.modulos[d];
}

// Pode GRAVAR o documento? Devolve o motivo da recusa, ou null se pode.
export function erroGravar(u, col, id) {
  const d = DONO[col];
  if (u.admin) return null;
  if (d === "admin") return "Só o administrador grava nesta área.";
  if (col === "eqp") return u.eqp ? null : "Seu acesso não inclui a Produtividade da equipe.";
  if (col === "sug") return id === u.id ? null : "Você só grava as suas próprias mensagens.";
  if (col === "faq") return "Só o administrador publica dúvidas frequentes.";
  const m = u.modulos[d];
  if (!m) return "Seu acesso não inclui esta área.";
  if (m.nivel !== "gestor") return "Seu acesso a esta área é só de consulta.";
  return null;
}
