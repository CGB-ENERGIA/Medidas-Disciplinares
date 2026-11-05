// POST /api/logout → encerra a sessão no banco e apaga o cookie
import { rota } from "./_lib/db.js";
import { encerrarSessao, comCookie, ok } from "./_lib/auth.js";

export const POST = rota(async request => comCookie(ok({ saiu: true }), await encerrarSessao(request)));
