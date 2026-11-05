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

-- ---------- Usuários do sistema (preenchida quando o login entrar)
create table if not exists usuarios (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique,
  nome         text not null,
  perfil       text not null check (perfil in ('supervisor', 'coordenador', 'dp')),
  chave_pessoa text,           -- chave em equipes.supervisor ou equipes.coordenador
  ativo        boolean not null default true,
  criado_em    timestamptz not null default now()
);

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
