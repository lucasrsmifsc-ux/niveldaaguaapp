// Capivara Hidrológica S.A. — Departamento de Conteúdo Oficial
// SÓ DADOS. O conteúdo É o produto. Nenhuma lógica aqui dentro.

export const VERSAO = 'v2.golfinho.5 — ensina a instalar o posto de comando';
export const VERSAO_JACARE = 'v3.jacare.1 — build clandestino, aprovado pelo jacaré';

export const LOADING_MESSAGES = [
  'Acordando o peixe de plantão...',
  'Calibrando o chinelo métrico oficial (nº 42)...',
  'Perguntando pro sapo da margem... ele tá de folga.',
  'Negociando sinal com o satélite GOIABA-7...',
  'Molhando o dedão do estagiário pra confirmar...',
  'Consultando a tia que sente chuva no joelho...',
  'Convertendo palmos em capivaras (norma NBR-1987)...',
  'Aguardando o pato de borracha assinar o laudo...',
  'Triangulando com três garrafas de guaraná...',
  'Removendo um chinelo perdido do sensor...',
  'A capivara pediu cinco minutinhos. Conseguimos dois segundos.',
  'Consultando os anais da cheia de 83... (relaxa, nem perto)',
  'Sincronizando horário de Brasília com o horário do fogão a lenha...',
  'Traduzindo o relatório do gauchês pro manezinho...',
  'Contando as pedras do fundo... faltam três.',
  'Aplicando a norma ABNT do Pantanal, seção molhada...',
  'Esperando passar a lancha do vizinho pra descontar a marola...',
  'Reiniciando o roteador da margem esquerda...',
  'O estagiário derrubou a trena na água. De novo.',
  'Verificando se mexeram na régua... foi o vento.',
  'Pedindo silêncio pros grilos durante a leitura...',
  'Assoprando a poeira do sensor (procedimento técnico)...',
];

export const STALL_87 = '87% — aguardando o peixe confirmar a leitura...';

export const MEASURING_EXTRAS = [
  'Recontando as capivaras...',
  'A internet do rio está lenta hoje...',
  'Pedindo pro satélite GOIABA-7 caprichar...',
];

// 1 unidade = `m` metros. `s` singular, `p` plural, `piada` vai entre parênteses.
export const UNITS = [
  { s: 'capivara empilhada', p: 'capivaras empilhadas', m: 0.52, piada: 'elas não gostam, mas colaboram' },
  { s: 'chinelo nº 42 em pé', p: 'chinelos nº 42 em pé', m: 0.27, piada: 'par direito' },
  { s: 'garrafa de guaraná 2L', p: 'garrafas de guaraná 2L', m: 0.33, piada: 'geladas, para fins de calibração' },
  { s: 'botijão de gás', p: 'botijões de gás', m: 0.58, piada: 'cheios; vazio flutua e invalida o laudo' },
  { s: 'tamanduá de pé', p: 'tamanduás de pé', m: 1.2, piada: 'o tamanduá apresentou reclamação formal' },
  { s: 'palmo do responsável pela residência', p: 'palmos do responsável pela residência', m: 0.22, piada: 'unidade oficial da casa' },
  { s: 'cuia de chimarrão', p: 'cuias de chimarrão empilhadas', m: 0.16, piada: 'sem a bomba' },
  { s: 'pinhão enfileirado', p: 'pinhões enfileirados', m: 0.04, piada: 'safra de Lages, certificados' },
  { s: 'balde de feijoada', p: 'baldes de feijoada', m: 0.35, piada: 'unidade aprovada por unanimidade' },
  { s: 'antena de Fusca 78', p: 'antenas de Fusca 78', m: 1.1, piada: 'esticadas, conforme o manual' },
  { s: 'bolacha empilhada', p: 'bolachas empilhadas', m: 0.007, piada: 'sim, BOLACHA, o laudo não aceita "biscoito"' },
  { s: 'degrau de escada de pedreiro', p: 'degraus de escada de pedreiro', m: 0.3, piada: 'a escada é emprestada' },
];

export const CONVERSION_LINE = '≈ {m} m em unidades sem graça (metros) · margem de erro: 1 bigode de capivara';

export const VERDICTS = {
  seco: [
    'Rio mais calmo que domingo depois do almoço. A maior ameaça hidrológica hoje é o vizinho lavando a calçada.',
    'Nível dentro do esperado. Se algo subir hoje, é o cheiro de churrasco.',
    'Tá tão seco que o peixe pediu protetor solar. Preocupação: nenhuma.',
    'Situação: paz. O pato de borracha encalhou de tédio e foi registrado em ata.',
    'Nada a declarar. A capivara saiu pra uma soneca oficial (remunerada, com direitos).',
    'O nível está estável há tanto tempo que a régua criou limo. Tecnicamente, isso é um elogio.',
    'Zero risco de enchente. Risco de mosquito no fim da tarde: esse sim, alto. Recomenda-se raquete elétrica.',
    'O rio hoje não dá nem notícia. Igual filho adolescente: quieto porque está tudo bem.',
  ],
  leve: [
    'Vem uma chuvinha aí, dessas de dormir bem. O rio agradece e o senhor também.',
    'Chuva fraca no radar. O rio sobe menos que bolo com fermento vencido.',
    'Garoa prevista. A capivara nem vai tirar o capacete. Preocupação dispensada por escrito.',
    'Vai pingar. O nível sobe uns dedos e desce antes do café passar.',
    'Chuva passageira confirmada: cai, pede licença e vai embora. O rio continua no lugar dele.',
    'Molha a horta, lava a poeira, não chega nem na metade do quintal.',
    'Uns pingos vêm aí. Nível de providência: recolher a roupa do varal. Só isso. É a providência inteira.',
    'Previsão de chuva educada. O rio recebe, agradece e devolve o troco pro mar, como sempre.',
  ],
  forte: [
    'Vai chover, sim. O rio vai subir uns dois palmos e voltar pro lugar, como faz desde sempre.',
    'Chuva forte prevista. O rio vai encher o peito, se exibir um pouco e desinchar. Ele faz isso desde 1987. Nunca falhou.',
    'Confirmado: água do céu em quantidade. O quintal tem margem de sobra — literalmente. A capivara segue no posto, de capa.',
    'Vem temporal. O rio sobe, resmunga, e amanhã já está pedindo desculpa. Se quiser, assista da janela com um café: é só espetáculo.',
    'Chuva forte no boletim. Tradução técnica: barulho bom no telhado, rio mais gordo, casa seca. Monitoramento de 15 em 15 minutos (a equipe é uma capivara, mas é dedicada).',
    'Vai cair água grossa. Nosso cálculo: o rio precisaria de 4 tamanduás de chuva pra incomodar. Vem meio tamanduá, no máximo.',
    'Sim, vai chover bastante. Não, o rio não alcança a churrasqueira. A churrasqueira está sob proteção pessoal desta capivara.',
    'Temporal à vista. Recomendação oficial: fechar as janelas, esquentar o café e deixar o resto com o rio, que conhece o caminho dele há muito tempo.',
  ],
};

export const OFFLINE_VERDICTS = [
  'Nossos sensores foram levados por uma capivara concorrente. Medição 100% baseada em intuição. A intuição diz: tranquilo.',
  'Sem internet no momento. O rio, consultado pessoalmente, informou que está tudo em ordem.',
  'O satélite GOIABA-7 caiu (de sono). Medição feita no olho — e o olho da capivara é treinado.',
  'Falha de comunicação com a central. Por sorte, a régua não precisa de wi-fi: nível visivelmente normal.',
];

export const SIGNATURES = [
  '— Dona Jurema, Capivara Chefe',
  '— Depto. de Ficar Tranquilo',
  '— Diretoria de Assuntos Molhados',
];

export const IPP_CAPTIONS = [
  { v: 0.3, txt: 'equivalente a duvidar se desligou o ferro (nem passou roupa hoje)' },
  { v: 0.4, txt: 'equivalente a esquecer se trancou o carro (trancou)' },
  { v: 0.6, txt: 'nível: pisar de meia em chão que talvez esteja molhado' },
  { v: 0.8, txt: 'nível: achar que o celular vibrou no bolso. Não vibrou.' },
  { v: 1.0, txt: 'igual escutar barulho no telhado e ser só um gato gordo' },
  { v: 1.4, txt: 'igual o vizinho olhar torto (era sol no olho dele)' },
  { v: 1.9, txt: 'comparável a ver nuvem escura chegando no meio do churrasco' },
  { v: 2.3, txt: 'nível: o filho saiu de moto e ainda não mandou o "cheguei" (mandou, o senhor não viu)' },
  { v: 2.5, txt: 'MÁXIMO HISTÓRICO REGISTRADO: acabar o gás no meio do banho. E olhe lá.' },
];

export const IPP_OFFLINE_CAPTION = 'sensores de preocupação em manutenção. Estimativa da casa: baixa, como sempre.';

export const STAMPS = [
  'AFERIDO PELO INMETRO DO MATO',
  'AUDITADO POR 3 CAPIVARAS INDEPENDENTES',
  'CERTIFICADO PELA ABNT DO PANTANAL',
  'HOMOLOGADO PELO SINDICATO DOS PATOS DE BORRACHA',
  'CONFORME NORMA NBR-1987/CAPIVARA, ART. 2º, PARÁGRAFO MOLHADO',
  'VALIDADO PELO CONSELHO REGIONAL DE MOLHAR O PÉ — CRMP/SC',
  'APROVADO NA REUNIÃO DE SEGUNDA (A CAPIVARA COCHILOU, MAS APROVOU)',
  'FIRMA RECONHECIDA NO CARTÓRIO DA MARGEM ESQUERDA',
];

export const FORECAST_TEMPLATES = {
  seco: [
    '{prob}% de chuva — pode estender lençol no varal com arrogância.',
    'Seco. O guarda-chuva segue de férias, sem data pra voltar.',
    '{prob}% de chance de nada. A mangueira do jardim vai ter que trabalhar.',
    'Sol batendo ponto. O rio de bobeira.',
  ],
  leve: [
    '{prob}% de chance de chuva — leve o guarda-chuva pra garantir que NÃO chova. Funciona sempre.',
    '{prob}% de chuva, daquelas que a gente discute se molha ou não molha.',
    'Chuvinha de {mm} mm — lava o carro de graça, mal e mal.',
    'Tempo indeciso. Igual gente na frente da geladeira aberta.',
  ],
  forte: [
    '{prob}% de chance de chuva — dia perfeito pra reclamar do tempo com propriedade.',
    'Vem água ({mm} mm). Programa oficial: janela, café e deboche.',
    'Chuva das grandes. O rio engorda um pouco, a capivara acompanha de capa. O senhor, do sofá.',
    '{prob}% de chuva. O varal perdeu. Aceita que dói menos.',
  ],
};

export const FORECAST_FOOTER = 'Total previsto: {mm} mm — o rio recebe isso de café da manhã.';
export const FORECAST_STALE_BANNER = 'BOLETIM DE {h}H ATRÁS — a chuva não deve ter mudado de ideia.';
export const FORECAST_OFFLINE_BANNER = 'BOLETIM DE ONTEM — sem internet, mas o rio não fugiu.';

// weather_code (WMO) -> rótulo + tipo de ícone
export const WMO = [
  { codes: [0, 1], label: 'céu de brigadeiro', icon: 'sol' },
  { codes: [2], label: 'sol com nuvem de enfeite', icon: 'solnuvem' },
  { codes: [3], label: 'nublado profissional', icon: 'nublado' },
  { codes: [45, 48], label: 'neblina de novela', icon: 'neblina' },
  { codes: [51, 53, 55, 56, 57], label: 'garoa técnica', icon: 'garoa' },
  { codes: [61, 63, 80, 81], label: 'chuva de verdade', icon: 'chuva' },
  { codes: [65, 82], label: 'chuva caprichada', icon: 'chuva' },
  { codes: [66, 67], label: 'chuva gelada (agasalhe o joelho)', icon: 'chuva' },
  { codes: [71, 73, 75, 77, 85, 86], label: 'NEVE?! anota a data', icon: 'neve' },
  { codes: [95, 96, 99], label: 'temporal dos bons', icon: 'temporal' },
];

export const EXTREME_LINE =
  'Capricho de engenheiro: se quiser, deixa o carro na parte alta da rua. Não precisa. Mas engenheiro gosta.';

export const TURBO_LINE = 'medição turbinada — precisão reduzida em 3 capivaras';
export const TOPHAT_LINE = 'ANOMALIA REGISTRADA: peixe inexplicavelmente elegante.';
export const PRESS_5_LINE = 'NOTA DA ESTAÇÃO: o rio continua no mesmo lugar. A capivara está começando a te achar carente.';
export const PRESS_10_LINE =
  'DIPLOMA EMITIDO: por medir o rio 10 vezes num só dia, o senhor foi nomeado FISCAL HIDROLÓGICO HONORÁRIO. A capivara bateu continência.';

export const CAPIVARAS_PLANTAO = ['Jurema', 'Valdir', 'Cleusa', 'Bagre', 'Marlene', 'Sônia', 'Adenor'];

export const IDLE_PANEL = 'AGUARDANDO MEDIÇÃO... A CAPIVARA ESTÁ PRONTA. (ela está sempre pronta)';

export const CONDICAO_LABELS = {
  sol: 'CONDIÇÃO ATUAL: CÉU PRESTANDO SERVIÇO NORMALMENTE',
  nublado: 'CONDIÇÃO ATUAL: NUVENS EM REUNIÃO, SEM DELIBERAÇÃO',
  chuva: 'CONDIÇÃO ATUAL: ÁGUA DO CÉU EM EXPEDIENTE. RIO CIENTE.',
};

export const STALE_BADGE = 'dados de {h}h atrás (a chuva não deve ter mudado de ideia)';

export const TOASTS = {
  posse: 'Posse registrada em ata. O cartório da margem esquerda agradece.',
  pularPosse: 'Burocracia pulada. A capivara vai fingir que não viu.',
  cidadeSalva: 'Cidade registrada no Departamento de Assuntos Molhados.',
  festaJurema: 'Conquista desbloqueada: A Festa Secreta da Jurema',
  almirante: 'O pato foi promovido: ALMIRANTE Nº 042. A esquadra é ele mesmo.',
  jacare: 'Visita ilustre registrada em ata. Óculos escuros: próprios.',
  turbo: 'MODO TURBO HIDROLÓGICO ATIVADO',
  installNudge: 'Dica: instale a Estação no celular (menu > Adicionar à tela inicial). Funciona até sem sinal, igual rádio de pilha.',
};

export const SHARE_TEXT = `BOLETIM OFICIAL — Capivara Hidrológica S.A.
Nível do rio: {valor}
IPP™ (Índice de Preocupação do Pai): {ipp}/10 — {caption}
Veredito: {veredito}
Chuva hoje: {prob}% ({mm} mm)
Aferido por uma capivara de capacete.
Documento sem validade jurídica, com validade emocional.
{url}`;

export const DISCLAIMER =
  'Em caso de enchente de verdade, confie mais na <a href="tel:199">Defesa Civil (199)</a> do que numa capivara de capacete. Ela é ótima, mas é uma capivara.';

export const SETUP = {
  titulo: 'BEM-VINDO À CENTRAL DE MONITORAMENTO',
  texto: 'Antes de iniciar as operações, precisamos saber qual rio vigiar. Informe a cidade da residência (a do rio, não a da sogra).',
  placeholder: 'Digite sua cidade...',
  dica: 'Ex.: Rio do Sul, Blumenau, Itajaí, Brusque...',
  semResultado: 'Cidade não localizada nos arquivos. Verifique a grafia (a capivara é rigorosa).',
};
