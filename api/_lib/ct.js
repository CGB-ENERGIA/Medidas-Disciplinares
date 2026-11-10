// Apoio do módulo Contratações: nomes sem acento e a regra de quem enxerga o quê.
export const COLECOES = ["candidatos", "vagas", "rm", "config", "talentos", "talentosEd"];

// Nome sem acento, em maiúsculas e sem espaços repetidos (mesma regra do site de Contratações)
export const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();

// O usuário fim (solicitante) vê o registro se o nome do solicitante gravado nele bate com o nome dele.
// Aceita registros antigos só com parte do nome (ex.: "DEILTON") e vários solicitantes separados por "/".
export function visivelPara(solicitanteNorm, nomeDaPessoa) {
  const pessoa = norm(nomeDaPessoa), a = String(solicitanteNorm || "");
  if (!pessoa || !a) return false;
  if (a.includes(pessoa)) return true;
  const palavras = pessoa.split(" ");
  return a.split("/").some(p => { const t = p.trim().split(" ").filter(Boolean); return t.length > 0 && t.every(x => palavras.includes(x)); });
}

// Comparação de objetos que ignora a ordem das chaves
export function mesmoConteudo(a, b) {
  const ord = v => Array.isArray(v) ? v.map(ord) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, ord(v[k])])) : v;
  return JSON.stringify(ord(a)) === JSON.stringify(ord(b));
}
