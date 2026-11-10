// Teste rápido da API contra o servidor local (npm run dev).
// Uso:  npm run teste
//       TESTE_USUARIO=fulano TESTE_SENHA=... npm run teste   (também confere o que um usuário logado recebe)
// Endereço: TESTE_URL (padrão http://localhost:3000). Não grava nada no banco.
const B = process.env.TESTE_URL || `http://localhost:${process.env.PORT || 3000}`;
let falhas = 0;
const ok = (nome, cond, extra = "") => { console.log(`${cond ? "OK     " : "FALHOU "}${nome}${extra ? " — " + extra : ""}`); if (!cond) falhas++; };
const req = (rota, op = {}) => fetch(B + rota, { redirect: "manual", ...op });
const json = { "content-type": "application/json" };

ok("API no ar", (await req("/api/saude")).status === 200);
for (const r of ["/api/eu", "/api/carga", "/api/referencias", "/api/solicitacoes", "/api/usuarios", "/api/arquivo?id=1", "/api/colaboradores", "/api/ct-docs?col=vagas", "/api/ct-arquivos?id=00000000-0000-0000-0000-000000000000", "/api/ct-nomes?ids=x"])
  ok(`sem login: ${r} pede login`, (await req(r)).status === 401);
ok("sem login: excluir usuário pede login", (await req("/api/usuarios", { method: "DELETE", headers: { "content-type": "application/json" }, body: "{\"id\":\"x\"}" })).status === 401);
ok("login errado é recusado", (await req("/api/login", { method: "POST", headers: json, body: JSON.stringify({ usuario: "ninguem.teste", senha: "errada123" }) })).status === 401);
ok("formulário sem JSON é recusado", (await req("/api/login", { method: "POST", body: "usuario=x&senha=y" })).status === 400);
ok("página do módulo Contratações e adaptador existem", (await req("/contratacoes.html")).status === 200 && (await req("/ct-adaptador.js")).status === 200);
ok("site carrega o modelo do documento", (await (await req("/")).text()).includes("modelo-docx.js") && (await req("/modelo-docx.js")).status === 200);

if (process.env.TESTE_USUARIO) {
  const l = await req("/api/login", { method: "POST", headers: json, body: JSON.stringify({ usuario: process.env.TESTE_USUARIO, senha: process.env.TESTE_SENHA || "" }) });
  ok("login do usuário de teste", l.status === 200);
  const h = { cookie: (l.headers.get("set-cookie") || "").split(";")[0] };
  const eu = await (await req("/api/eu", { headers: h })).json();
  ok("/api/eu traz os acessos por módulo", !!eu.modulos && Object.keys(eu.modulos).length > 0, Object.keys(eu.modulos || {}).join(" + ") + (eu.admin ? " (administrador)" : ""));
  const medidas = !!(eu.modulos && eu.modulos.medidas);
  const carga = await req("/api/carga", { headers: h });
  ok("carga de Medidas só para quem tem o módulo", carga.status === (medidas ? 200 : 403));
  if (medidas) { const c = await carga.json();
    ok("carga traz colaboradores", Array.isArray(c.colaboradores), `${c.colaboradores?.length} colaboradores`);
    ok("todos os perfis veem todas as equipes", new Set(c.colaboradores.map(x => x[9])).size > 1); }
  const ct = eu.modulos && eu.modulos.contratacoes;
  ok("documentos de Contratações só para quem tem o módulo", (await req("/api/ct-docs?col=vagas", { headers: h })).status === (ct ? 200 : 403));
  ok("tela Usuários só para o administrador", (await req("/api/usuarios", { headers: h })).status === (eu.admin ? 200 : 403));
  await req("/api/logout", { method: "POST", headers: { ...h, ...json }, body: "{}" });
  ok("depois de sair a sessão não vale", (await req("/api/eu", { headers: h })).status === 401);
}
console.log(falhas ? `\n${falhas} falha(s).` : "\nTudo certo.");
process.exit(falhas ? 1 : 0);
