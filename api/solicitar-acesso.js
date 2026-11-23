// POST /api/solicitar-acesso  { nome, matricula, setor, usuario, senha } → cria um pedido de acesso (público, sem login)
// A pessoa escolhe a própria senha. O cadastro fica PENDENTE (sem acesso a nada) até um administrador aprovar
// e definir o nível em cada ambiente (aba Usuários). Limite: 5 pedidos por hora vindos do mesmo computador.
import { consulta, rota } from "./_lib/db.js";
import { lerJSON, ipDe, ok, erro } from "./_lib/auth.js";
import { hashSenha, normalizarUsuario, usuarioPedidoValido, problemaSenha } from "./_lib/senha.js";

const MAX_POR_HORA = 5;

export const POST = rota(async request => {
  const c = await lerJSON(request); if (!c) return erro("Dados inválidos.", 400);
  const nome = String(c.nome || "").trim().replace(/\s+/g, " "), matricula = String(c.matricula || "").trim();
  const setor = String(c.setor || "").trim().replace(/\s+/g, " "), usuario = normalizarUsuario(c.usuario), senha = String(c.senha || "");
  if (nome.length < 5 || nome.length > 100 || !nome.includes(" ")) return erro("Informe o nome completo.", 400);
  if (!/^\d{1,10}$/.test(matricula)) return erro("A matrícula deve ter só números, com até 10 dígitos.", 400);
  if (setor.length < 2 || setor.length > 80) return erro("Informe o setor.", 400);
  if (!usuarioPedidoValido(usuario)) return erro("Usuário deve ter de 3 a 40 caracteres: letras minúsculas, números, ponto ou hífen (ex.: joao.silva).", 400);
  const problema = problemaSenha(senha); if (problema) return erro(problema, 400);

  const ip = ipDe(request) || "desconhecido";
  const [{ n }] = await consulta("select count(*)::int as n from pedidos_acesso where ip = $1 and criado_em > now() - interval '1 hour'", [ip]);
  if (n >= MAX_POR_HORA) return erro("Muitos pedidos vindos deste computador. Tente de novo daqui a uma hora.", 429);
  await consulta("insert into pedidos_acesso (ip) values ($1)", [ip]);

  const [existe] = await consulta("select 1 from usuarios where usuario = $1", [usuario]);
  if (existe) return erro(`O usuário "${usuario}" já existe. Escolha outro (ex.: acrescente uma inicial do meio).`, 409);
  try {
    await consulta(`insert into usuarios (usuario, nome, matricula, setor, senha_hash, trocar_senha, ativo, pendente, solicitado_em)
                    values ($1, $2, $3, $4, $5, false, false, true, now())`, [usuario, nome, matricula, setor, await hashSenha(senha)]);
  } catch (e) {
    if (e && e.code === "23505") return erro(`O usuário "${usuario}" já existe. Escolha outro.`, 409);
    throw e;
  }
  return ok({ pendente: true }, 201);
});
