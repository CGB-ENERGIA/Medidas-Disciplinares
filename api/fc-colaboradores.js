// GET /api/fc-colaboradores → colaboradores ATIVOS para o Atendimento escolher o nome em "Registrar atendimento"
// (chapa, nome, função, base, setor, supervisor, coordenador). Exige login e acesso à área Atendimento da Central
// (consulta ou gestor; o administrador também). Os nomes só saem daqui, depois do login: não ficam no código da página.
import { consulta, rota } from "./_lib/db.js";
import { comLogin, ok } from "./_lib/auth.js";

export const GET = rota(comLogin(async () => {
  const linhas = await consulta(`
    select c.chapa, c.nome, c.funcao, c.base, e.setor, e.supervisor, e.coordenador
      from colaboradores c left join equipes e using (chapa)
     where c.ativo
     order by c.nome`);
  return ok({ total: linhas.length, colaboradores: linhas });
}, { modulo: "atendimento" }));
