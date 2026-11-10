-- =====================================================================
-- Sistema de Medidas Disciplinares · CGB
-- Estrutura do banco (PostgreSQL / Neon)
--
-- Pode rodar quantas vezes quiser: só cria o que ainda não existe.
-- Rodar com:  npm run db:schema
-- =====================================================================

-- ---------- Bases operacionais (BCB, STI, PDT, PDS, ITM, BDC)
create table if not exists bases (
  sigla text primary key,
  nome  text not null
);

-- ---------- Gestores (coordenadores e gestores de indiretos): chave curta → nome completo
create table if not exists gestores (
  chave text primary key,
  nome  text not null
);

-- ---------- Colaboradores (cadastro do RM / TOTVS)
-- Só o necessário: sem CPF, RG, endereço ou telefone.
create table if not exists colaboradores (
  chapa         text primary key,
  nome          text not null,
  funcao        text,
  base          text references bases (sigla),
  centro_custo  text,
  sexo          char(1) check (sexo in ('M', 'F')),
  sexo_origem   text check (sexo_origem in ('cadastro', 'dp', 'deduzido')),
  ativo         boolean not null default true,
  atualizado_em timestamptz not null default now()
);

-- ---------- Equipes (base-resumo do Gerenciador de Equipes)
-- Define quem vê quem: supervisor e coordenador de cada colaborador.
create table if not exists equipes (
  chapa         text primary key references colaboradores (chapa) on delete cascade,
  setor         text,
  equipe        text,
  tipo_equipe   text,
  supervisor    text,          -- chave do supervisor (ex.: LUIS FILIPE)
  coordenador   text,          -- chave do coordenador/gestor (ex.: AFONSO)
  atualizado_em timestamptz not null default now()
);
create index if not exists equipes_supervisor_idx  on equipes (supervisor);
create index if not exists equipes_coordenador_idx on equipes (coordenador);

-- ---------- Usuários do sistema (login por usuário e senha; não usa e-mail)
create table if not exists usuarios (
  id                uuid primary key default gen_random_uuid(),
  usuario           text,          -- nome de login (minúsculo, ex.: joao.silva)
  email             text unique,   -- opcional, não é usado no login
  nome              text not null,
  perfil            text check (perfil in ('supervisor', 'coordenador', 'dp')),   -- papel no módulo Medidas Disciplinares (vazio = sem acesso a ele)
  chave_pessoa      text,          -- chave em equipes.supervisor ou equipes.coordenador
  senha_hash        text,          -- scrypt, nunca a senha em texto
  trocar_senha      boolean not null default true,   -- obriga trocar a senha no próximo acesso
  tentativas_falhas integer not null default 0,
  bloqueado_ate     timestamptz,   -- bloqueio temporário após várias senhas erradas
  ultimo_acesso     timestamptz,
  ativo             boolean not null default true,
  criado_em         timestamptz not null default now()
);
-- (para bancos criados antes do login: acrescenta o que falta)
alter table usuarios alter column email drop not null;
alter table usuarios add column if not exists usuario text;
alter table usuarios add column if not exists senha_hash text;
alter table usuarios add column if not exists trocar_senha boolean not null default true;
alter table usuarios add column if not exists tentativas_falhas integer not null default 0;
alter table usuarios add column if not exists bloqueado_ate timestamptz;
alter table usuarios add column if not exists ultimo_acesso timestamptz;
-- usuário excluído que já participou de alguma medida: some da lista e o login fica livre; o histórico continua apontando para ele
alter table usuarios add column if not exists excluido_em timestamptz;
-- Acessos por módulo (nov/2026): administrador tem controle total; cada módulo tem o seu nível
--   Medidas Disciplinares: usuarios.perfil (supervisor/coordenador = usuário; dp = gestor)
--   Contratações:          usuarios.contratacoes (usuario = solicitante; gestor = Recrutamento; leitura = Gestão)
alter table usuarios add column if not exists admin boolean not null default false;
alter table usuarios add column if not exists contratacoes text;
alter table usuarios alter column perfil drop not null;
alter table usuarios drop constraint if exists usuarios_perfil_check;
alter table usuarios add constraint usuarios_perfil_check check (perfil is null or perfil in ('supervisor', 'coordenador', 'dp'));
alter table usuarios drop constraint if exists usuarios_contratacoes_check;
alter table usuarios add constraint usuarios_contratacoes_check check (contratacoes is null or contratacoes in ('usuario', 'gestor', 'leitura'));
create unique index if not exists usuarios_usuario_idx on usuarios (usuario);

-- ---------- Sessões de login (o navegador guarda só um código; aqui fica o hash dele)
create table if not exists sessoes (
  token_hash text primary key,
  usuario_id uuid not null references usuarios (id) on delete cascade,
  criada_em  timestamptz not null default now(),
  expira_em  timestamptz not null,
  ip         text,
  agente     text
);
create index if not exists sessoes_usuario_idx on sessoes (usuario_id);

-- ---------- Anexo I da Política de Consequências (PG.001.SGI 019)
create table if not exists desvios (
  item                integer primary key,
  descricao           text not null,
  nivel               text not null check (nivel in ('Leve', 'Média', 'Grave', 'Gravíssima')),
  medida_padrao       text not null,
  medida_reincidencia text not null,
  alinea_sugerida     char(1) not null
);

-- ---------- Modelos de texto do fato
create table if not exists modelos_texto_fato (
  categoria       text primary key,
  rotulo          text not null,
  item            integer references desvios (item),
  alinea          char(1),
  texto_modelo    text not null,
  documentos_base integer
);

-- ---------- Municípios do Maranhão (lista da cidade da ocorrência)
create table if not exists municipios (
  nome text primary key
);

-- ---------- Frota ativa
create table if not exists frota (
  placa         text primary key,
  modelo        text,
  tipo          text,
  base          text,
  prefixo       text,
  ativo         boolean not null default true,
  atualizado_em timestamptz not null default now()
);

-- ---------- Medidas disciplinares
-- origem = 'sistema' → criada no site (conta para sugestão e reincidência)
-- origem = 'planilha' ou 'ponto' → histórico antigo importado (só consulta)
create table if not exists medidas (
  id                    bigint generated always as identity primary key,
  codigo                text generated always as ('MD-' || lpad(id::text, 4, '0')) stored,
  colaborador_chapa     text not null references colaboradores (chapa),
  data_ocorrido         date not null,
  desvios               integer[] not null default '{}',   -- itens do Anexo I marcados
  desvio_principal      integer references desvios (item),  -- o mais grave (5.2)
  item_texto            text,                               -- histórico antigo: item escrito à mão (ex.: "10 ou 26")
  cidade                text,
  ponto_referencia      text,
  placa                 text,
  relato                text,
  texto_fato            text,
  origem_texto          text check (origem_texto in ('ia', 'modelo', 'relato')),
  medida_sugerida       text,
  medida                text not null,
  medida_aprovada       text,
  alinea                char(1),
  dias                  integer check (dias between 1 and 30),
  inicio_suspensao      date,
  modelo_doc            text not null default 'padrao' check (modelo_doc in ('padrao', 'pm')),
  datas_ponto_manual    date[],
  tratamento_sexo       char(1) check (tratamento_sexo in ('M', 'F')),
  status                text not null check (status in
                          ('coord', 'dp', 'aplicacao', 'conferencia', 'concluida', 'recusada', 'cancelada')),
  status_antes          text,                               -- status de quando foi cancelada
  solicitante_perfil    text not null default 'supervisor' check (solicitante_perfil in ('supervisor', 'coordenador', 'dp')),
  solicitante_id        uuid references usuarios (id),
  motivo_recusa         text,
  motivo_cancelamento   text,
  cancelado_em          timestamptz,
  cancelado_por         text,
  recusa_assinatura     boolean not null default false,     -- colaborador recusou, 2 testemunhas (5.4)
  doc_assinado_pendente boolean not null default false,
  conta_reincidencia    boolean not null default true,      -- false para reorientação
  origem                text not null default 'sistema' check (origem in ('sistema', 'planilha', 'ponto')),
  exemplo               boolean not null default false,     -- dados de teste
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now()
);
create index if not exists medidas_colab_data_idx on medidas (colaborador_chapa, data_ocorrido desc);
create index if not exists medidas_status_idx     on medidas (status);
create index if not exists medidas_desvios_idx    on medidas using gin (desvios);
create index if not exists medidas_origem_idx     on medidas (origem);

-- atualizado_em automático
create or replace function tocar_atualizado_em() returns trigger language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end $$;
drop trigger if exists medidas_atualizado_em on medidas;
create trigger medidas_atualizado_em before update on medidas
  for each row execute function tocar_atualizado_em();

-- ---------- Histórico de cada medida (só inserção: nunca editar nem apagar)
-- Solicitações do sistema: o registro completo que a tela usa (relato, texto, histórico, fotos, imagens do documento).
-- As colunas acima são preenchidas a partir dele, para consultas e indicadores.
alter table medidas add column if not exists dados jsonb;
create index if not exists medidas_sistema_idx on medidas (status) where origem = 'sistema';

create table if not exists medidas_historico (
  id           bigint generated always as identity primary key,
  medida_id    bigint not null references medidas (id),
  quando       timestamptz not null default now(),
  usuario_id   uuid references usuarios (id),
  usuario_nome text,
  perfil       text,
  acao         text not null
);
create index if not exists medidas_historico_medida_idx on medidas_historico (medida_id, quando);

create or replace function bloquear_alteracao_historico() returns trigger language plpgsql as $$
begin
  raise exception 'O histórico das medidas não pode ser alterado nem apagado.';
end $$;
drop trigger if exists medidas_historico_somente_insercao on medidas_historico;
create trigger medidas_historico_somente_insercao before update or delete on medidas_historico
  for each row execute function bloquear_alteracao_historico();

-- ---------- Arquivos de cada medida (o arquivo em si fica no Vercel Blob)
create table if not exists medidas_arquivos (
  id            bigint generated always as identity primary key,
  medida_id     bigint not null references medidas (id),
  tipo          text not null check (tipo in ('foto', 'evidencia', 'documento', 'assinado')),
  url           text not null,
  nome_arquivo  text,
  posicao       text check (posicao in ('apos_fato', 'antes_assinatura', 'anexo')),
  legenda       text,
  ordem         integer not null default 0,
  enviado_por   uuid references usuarios (id),
  criado_em     timestamptz not null default now()
);
create index if not exists medidas_arquivos_medida_idx on medidas_arquivos (medida_id);

-- ---------- Módulo Contratações (recrutamento e seleção) ----------
-- Os documentos têm o mesmo formato do site de Contratações original (candidatos, vagas, rm, config, talentos, talentosEd),
-- guardados como JSON. As regras de quem lê e escreve cada coisa ficam na API (api/ct-docs.js), por nível de acesso.
create sequence if not exists ct_versao_seq;
create table if not exists ct_docs (
  colecao          text not null check (colecao in ('candidatos', 'vagas', 'rm', 'config', 'talentos', 'talentosEd')),
  id               text not null,
  dados            jsonb not null,
  solicitante_norm text,                                   -- candidatos e vagas: nome do solicitante sem acento, em maiúsculas (filtro do usuário fim)
  criado_por       uuid references usuarios (id),
  atualizado_por   uuid references usuarios (id),
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now(),
  removido         boolean not null default false,          -- nada é apagado: "remover" só esconde
  versao           bigint not null default nextval('ct_versao_seq'),   -- cresce a cada gravação: a tela busca só o que mudou
  primary key (colecao, id)
);
create index if not exists ct_docs_versao_idx on ct_docs (colecao, versao);

-- Arquivos do módulo: currículos, certificados, documentos e RPs assinadas
create table if not exists ct_arquivos (
  id          uuid primary key default gen_random_uuid(),
  nome        text,
  tipo        text not null,
  tamanho     integer not null,
  conteudo    bytea not null,
  enviado_por uuid references usuarios (id),
  criado_em   timestamptz not null default now()
);
-- id que o arquivo tinha no site antigo (importação): evita guardar o mesmo arquivo duas vezes
alter table ct_arquivos add column if not exists origem_id text;
create unique index if not exists ct_arquivos_origem_idx on ct_arquivos (origem_id) where origem_id is not null;

-- Registro de quem gravou o quê (sem o conteúdo, só o rastro). Só aceita inserção.
create table if not exists ct_log (
  id           bigint generated always as identity primary key,
  quando       timestamptz not null default now(),
  usuario_id   uuid references usuarios (id),
  usuario_nome text,
  colecao      text not null,
  doc_id       text not null,
  acao         text not null
);
create index if not exists ct_log_doc_idx on ct_log (colecao, doc_id);
create or replace function bloquear_alteracao_ct_log() returns trigger language plpgsql as $$
begin raise exception 'O registro do módulo Contratações não pode ser alterado nem apagado.'; end $$;
drop trigger if exists ct_log_somente_insercao on ct_log;
create trigger ct_log_somente_insercao before update or delete on ct_log
  for each row execute function bloquear_alteracao_ct_log();
