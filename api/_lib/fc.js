// Fale Conosco público: dúvidas frequentes que valem enquanto o Atendimento não publicar as suas (coleção fc_faq, id "lista").
// O Atendimento edita tudo isso na Central → Fale Conosco → Dúvidas frequentes.
// Mesmos assuntos do card de divulgação do Fale Conosco
export const FC_ASSUNTOS = ["PONTO E JORNADA", "SALÁRIO E CONTRACHEQUE", "PLANO DE SAÚDE", "OUTROS BENEFÍCIOS", "FÉRIAS E AFASTAMENTOS",
  "DOCUMENTOS E DADOS CADASTRAIS", "SUGESTÕES E MELHORIAS", "REPÚBLICAS", "BANCO DE HORAS", "OUTRAS DÚVIDAS"];

export const FC_FAQ_PADRAO = [
  { id: "p1", as: "PONTO E JORNADA", p: "Esqueci de bater o ponto ou o aplicativo não registrou. O que faço?", r: "Faça a batida manual do ponto e avise o seu supervisor no mesmo dia, informando o horário correto." },
  { id: "p2", as: "PONTO E JORNADA", p: "Meu celular quebrou ou perdi o celular. Como bato o ponto?", r: "Enquanto estiver sem celular, faça a batida manual e avise o seu supervisor. O ponto pode ser registrado em outro aparelho com o seu acesso. Se perdeu a senha do aplicativo, abra uma solicitação aqui que o Atendimento passa o contato do DP." },
  { id: "p3", as: "BANCO DE HORAS", p: "Como sei quantas horas tenho no banco de horas?", r: "O saldo aparece na sua folha (cartão) de ponto. Se tiver dúvida sobre algum valor, abra uma solicitação informando o mês." },
  { id: "p4", as: "FÉRIAS E AFASTAMENTOS", p: "Quando vão ser as minhas férias?", r: "A programação de férias é feita com o seu supervisor. Procure-o para saber o período previsto. Se as férias já estiverem marcadas e você tiver dúvida sobre a assinatura, abra uma solicitação." },
  { id: "p5", as: "SALÁRIO E CONTRACHEQUE", p: "Como consigo o meu contracheque?", r: "O contracheque fica disponível pelo Informes. Se não tiver o link, abra uma solicitação com o assunto Salário e contracheque que o Atendimento envia para você." },
  { id: "p6", as: "SALÁRIO E CONTRACHEQUE", p: "Tenho dúvida sobre empréstimo consignado (margem, parcelas, saldo).", r: "A margem e o saldo do empréstimo são informados pelo banco onde você contratou. Se o desconto aparece no contracheque e não foi repassado ao banco, abra uma solicitação que o Atendimento verifica." },
  { id: "p7", as: "PLANO DE SAÚDE", p: "Como uso o plano de saúde e onde ele é aceito?", r: "Baixe o aplicativo do plano para ter a carteirinha e ver a rede credenciada da sua cidade. Se precisar do passo a passo para marcar consultas, abra uma solicitação." },
  { id: "p8", as: "OUTROS BENEFÍCIOS", p: "Como incluo um filho no salário-família?", r: "Leve os documentos do filho (certidão de nascimento e caderneta de vacinação ou comprovante escolar, conforme a idade) ao setor pessoal da sua base." },
  { id: "p9", as: "DOCUMENTOS E DADOS CADASTRAIS", p: "Quero atualizar meu celular ou e-mail.", r: "Abra uma solicitação com o assunto Documentos e dados cadastrais e informe o que mudou. O Atendimento repassa ao setor pessoal." },
  { id: "p10", as: "OUTRAS DÚVIDAS", p: "Abri uma solicitação. Como acompanho a resposta?", r: "Use a opção Acompanhar e informe o número do protocolo e a sua chapa. A resposta do Atendimento aparece ali." }
].map(x => ({ ...x, pub: true }));

export const FC_ST = ["NOVA", "ANDAMENTO", "RESOLVIDO"];
