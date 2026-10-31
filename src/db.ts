import {
  Usuario,
  Morador,
  Veiculo,
  Visitante,
  Acesso,
  Encomenda,
  Prestador,
  Ocorrencia,
  RestricaoAcesso,
  Reserva,
  Comunicado,
  NotificacaoMorador,
  PreAutorizacaoVisitante,
  Lead,
} from "./types.js";
import { TenantConfig, TENANTS } from "./tenant.js";
import { generate } from "../seeds/generate.ts";
import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

class InMemoryDB {
  usuarios: Usuario[] = [];
  moradores: Morador[] = [];
  veiculos: Veiculo[] = [];
  visitantes: Visitante[] = [];
  acessos: Acesso[] = [];
  encomendas: Encomenda[] = [];
  prestadores: Prestador[] = [];
  ocorrencias: Ocorrencia[] = [];
  restricoes: RestricaoAcesso[] = [];
  reservas: Reserva[] = [];
  comunicados: Comunicado[] = [];
  notificacoes: NotificacaoMorador[] = [];
  preautorizacoes: PreAutorizacaoVisitante[] = [];
  leads: Lead[] = [];

  // Multi-tenant: dados isolados por tenant
  tenantConfigs: TenantConfig[] = TENANTS;
  tenantData: Map<string, {
    moradores: Morador[];
    veiculos: Veiculo[];
    visitantes: Visitante[];
    acessos: Acesso[];
    encomendas: Encomenda[];
    prestadores: Prestador[];
    ocorrencias: Ocorrencia[];
    restricoes: RestricaoAcesso[];
    reservas: Reserva[];
    comunicados: Comunicado[];
    notificacoes: NotificacaoMorador[];
    preautorizacoes: PreAutorizacaoVisitante[];
  }> = new Map();

  private nextUserId = 1;
  private nextMoradorId = 1;
  private nextVeiculoId = 1;
  private nextVisitanteId = 1;
  private nextAcessoId = 1;
  private nextEncomendaId = 1;
  private nextPrestadorId = 1;
  private nextOcorrenciaId = 1;
  private nextRestricaoId = 1;
  private nextReservaId = 1;
  private nextComunicadoId = 1;
  private nextNotificacaoId = 1;
  private nextPreAutorizacaoId = 1;
  private nextLeadId = 1;

  constructor() {
    this.init();
  }

  getNextUserId() {
    return this.nextUserId++;
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.usuarios) && parsed.usuarios.length > 0) {
          this.usuarios = parsed.usuarios || [];
          this.moradores = parsed.moradores || [];
          this.veiculos = parsed.veiculos || [];
          this.visitantes = parsed.visitantes || [];
          this.acessos = parsed.acessos || [];
          this.encomendas = parsed.encomendas || [];
          this.prestadores = parsed.prestadores || [];
          this.ocorrencias = parsed.ocorrencias || [];
          this.restricoes = parsed.restricoes || [];
          this.reservas = parsed.reservas || [];
          this.comunicados = parsed.comunicados || [];
          this.notificacoes = parsed.notificacoes || [];
          this.preautorizacoes = parsed.preautorizacoes || [];
          this.leads = parsed.leads || [];

          this.nextUserId = parsed.nextUserId || (this.usuarios.length + 1);
          this.nextMoradorId = parsed.nextMoradorId || (this.moradores.length + 1);
          this.nextVeiculoId = parsed.nextVeiculoId || (this.veiculos.length + 1);
          this.nextVisitanteId = parsed.nextVisitanteId || (this.visitantes.length + 1);
          this.nextAcessoId = parsed.nextAcessoId || (this.acessos.length + 1);
          this.nextEncomendaId = parsed.nextEncomendaId || (this.encomendas.length + 1);
          this.nextPrestadorId = parsed.nextPrestadorId || (this.prestadores.length + 1);
          this.nextOcorrenciaId = parsed.nextOcorrenciaId || (this.ocorrencias.length + 1);
          this.nextRestricaoId = parsed.nextRestricaoId || (this.restricoes.length + 1);
          this.nextReservaId = parsed.nextReservaId || (this.reservas.length + 1);
          this.nextComunicadoId = parsed.nextComunicadoId || (this.comunicados.length + 1);
          this.nextNotificacaoId = parsed.nextNotificacaoId || (this.notificacoes.length + 1);
          this.nextPreAutorizacaoId = parsed.nextPreAutorizacaoId || (this.preautorizacoes.length + 1);
          this.nextLeadId = parsed.nextLeadId || (this.leads.length + 1);

          // Seed new collections if empty
          if (this.prestadores.length === 0) this.seedPrestadores();
          if (this.ocorrencias.length === 0) this.seedOcorrencias();
          if (this.restricoes.length === 0) this.seedRestricoes();
          if (this.reservas.length === 0) this.seedReservas();
          if (this.comunicados.length === 0) this.seedComunicados();
          if (this.notificacoes.length === 0) this.seedNotificacoes();
          if (this.preautorizacoes.length === 0) this.seedPreAutorizacoes();
          if (this.leads.length === 0) this.seedLeads();
          this.ensureDemoUsers();
    this.seedMultiTenant();
    if (this.moradores.length > 0) {
      this.moradores[0].cpf = "123.456.789-00";
      this.moradores[0].bloco = "05";
      this.moradores[0].apartamento = "502";
      this.moradores[0].telegram = "@carloslima502";
      this.moradores[0].nome_completo = "Carlos Lima";
    }
          return;
        }
      }
    } catch (err) {
      console.warn("Falha ao carregar banco do disco, inicializando com sementes:", err);
    }

    this.seed();
    this.seedMultiTenant();
    if (this.moradores.length > 0) {
      this.moradores[0].cpf = "123.456.789-00";
      this.moradores[0].bloco = "05";
      this.moradores[0].apartamento = "502";
      this.moradores[0].telegram = "@carloslima502";
      this.moradores[0].nome_completo = "Carlos Lima";
    }
    this.rebaseIds();
    this.save();
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = {
        usuarios: this.usuarios,
        moradores: this.moradores,
        veiculos: this.veiculos,
        visitantes: this.visitantes,
        acessos: this.acessos,
        encomendas: this.encomendas,
        prestadores: this.prestadores,
        ocorrencias: this.ocorrencias,
        restricoes: this.restricoes,
        reservas: this.reservas,
        comunicados: this.comunicados,
        notificacoes: this.notificacoes,
        preautorizacoes: this.preautorizacoes,
        leads: this.leads,
        nextUserId: this.nextUserId,
        nextMoradorId: this.nextMoradorId,
        nextVeiculoId: this.nextVeiculoId,
        nextVisitanteId: this.nextVisitanteId,
        nextAcessoId: this.nextAcessoId,
        nextEncomendaId: this.nextEncomendaId,
        nextPrestadorId: this.nextPrestadorId,
        nextOcorrenciaId: this.nextOcorrenciaId,
        nextRestricaoId: this.nextRestricaoId,
        nextReservaId: this.nextReservaId,
        nextComunicadoId: this.nextComunicadoId,
        nextNotificacaoId: this.nextNotificacaoId,
        nextPreAutorizacaoId: this.nextPreAutorizacaoId,
        nextLeadId: this.nextLeadId,
      };
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
      fs.renameSync(tmp, DB_FILE);
    } catch (err) {
      console.error("Erro ao persistir banco em disco:", err);
    }
  }

  seed() {
    const now = new Date();

    // Default admin & morador users (credenciais de demo)
    this.usuarios.push(
      {
        id: this.nextUserId++,
        nome: "Administrador",
         email: "adm@adm.com",
         senha_hash: "123",
        perfil: "administrador",
        ativo: true,
        criado_em: now.toISOString(),
      },
      {
        id: this.nextUserId++,
        nome: "Porteiro",
        email: "portaria@ambros.com",
         senha_hash: "123",
        perfil: "portaria",
        ativo: true,
        criado_em: now.toISOString(),
      },
      {
        id: this.nextUserId++,
        nome: "Carlos Lima",
        email: "carlos@ambros.com",
         senha_hash: "123",
        perfil: "morador",
        ativo: true,
        criado_em: now.toISOString(),
      },
      {
        id: this.nextUserId++,
        nome: "Sindico",
        email: "sindico@ambros.com",
         senha_hash: "123",
        perfil: "sindico",
        ativo: true,
        criado_em: now.toISOString(),
      }
    );

    // Moradores
    const m1: Morador = {
      id: this.nextMoradorId++,
      nome_completo: "Carlos Lima",
      cpf: "123.456.789-00",
      telefone: "(11) 98765-4321",
      whatsapp: "(11) 98765-4321",
      telegram: "@carloslima502",
      bloco: "05",
      apartamento: "502",
      vinculo: "proprietario",
      foto_url: null,
      numero_vaga: "V-045",
      ativo: true,
      criado_em: now.toISOString(),
    };
    const m2: Morador = {
      id: this.nextMoradorId++,
      nome_completo: "Maria Oliveira",
      cpf: "987.654.321-00",
      telefone: "(11) 91234-5678",
      whatsapp: "(11) 91234-5678",
      telegram: null,
      bloco: "08",
      apartamento: "103",
      vinculo: "inquilino",
      foto_url: null,
      numero_vaga: "V-112",
      ativo: true,
      criado_em: now.toISOString(),
    };
    const m3: Morador = {
      id: this.nextMoradorId++,
      nome_completo: "João Silva",
      cpf: "456.789.123-00",
      telefone: "(11) 99887-7665",
      whatsapp: "(11) 99887-7665",
      telegram: "@joaosilva201",
      bloco: "10",
      apartamento: "201",
      vinculo: "proprietario",
      foto_url: null,
      numero_vaga: "V-078",
      ativo: true,
      criado_em: now.toISOString(),
    };
    this.moradores.push(m1, m2, m3);

    // Veículos
    this.veiculos.push(
      {
        id: this.nextVeiculoId++,
        placa: "ABC1D23",
        modelo: "Onix",
        cor: "Prata",
        vaga: "V-045",
        morador_id: 1,
        tipo_vinculo: "proprietario",
        titulo: "Carlos Lima",
        criado_em: now.toISOString(),
      },
      {
        id: this.nextVeiculoId++,
        placa: "XYZ9F87",
        modelo: "HB20",
        cor: "Preto",
        vaga: "V-078",
        morador_id: 3,
        tipo_vinculo: "proprietario",
        titulo: "Mariana Costa",
        criado_em: now.toISOString(),
      },
      {
        id: this.nextVeiculoId++,
        placa: "BRA2E19",
        modelo: "Jeep Compass",
        cor: "Preto",
        vaga: "V-099",
        morador_id: 1,
        tipo_vinculo: "proprietario",
        titulo: "Carlos Lima",
        criado_em: now.toISOString(),
      }
    );

    // Visitantes
    this.visitantes.push(
      {
        id: this.nextVisitanteId++,
        nome: "José Santos",
        documento: "111.222.333-44",
        tipo_documento: "CPF",
        telefone: "(11) 97766-5544",
        foto_url: null,
        placa_veiculo: "ABC1D23",
        vaga: null,
        bloco: "10",
        apartamento: "201",
        morador_visitado_id: 3,
        agendado_para: null,
        presente: true,
        nome_visitante: "José Santos",
        documento_visitante: "111.222.333-44",
        data_prevista: undefined,
        observacao: undefined,
        criado_em: now.toISOString(),
      },
      {
        id: this.nextVisitanteId++,
        nome: "Ana Paula",
        documento: "555.666.777-88",
        tipo_documento: "CPF",
        telefone: "(11) 96655-4433",
        foto_url: null,
        placa_veiculo: null,
        vaga: null,
        bloco: "08",
        apartamento: "103",
        morador_visitado_id: 2,
        agendado_para: null,
        presente: true,
        nome_visitante: "Ana Paula",
        documento_visitante: "555.666.777-88",
        data_prevista: undefined,
        observacao: undefined,
        criado_em: now.toISOString(),
      }
    );

    // Acessos
    this.acessos.push(
      {
        id: this.nextAcessoId++,
        tipo_pessoa: "morador",
        pessoa_id: 1,
        nome: "Carlos Lima",
        sentido: "entrada",
        placa_veiculo: "ABC1D23",
        vaga: "V-045",
        observacao: null,
        registrado_em: new Date(now.getTime() - 3600000 * 2).toISOString(),
      },
      {
        id: this.nextAcessoId++,
        tipo_pessoa: "visitante",
        pessoa_id: 1,
        nome: "José Santos",
        sentido: "entrada",
        placa_veiculo: "ABC1D23",
        vaga: null,
        observacao: null,
        registrado_em: new Date(now.getTime() - 3600000).toISOString(),
      }
    );

    this.seedEncomendas();
    this.seedPrestadores();
    this.seedOcorrencias();
    this.seedRestricoes();
    this.seedReservas();
    this.seedComunicados();
    this.seedNotificacoes();
    this.seedPreAutorizacoes();
    this.seedLeads();
  }

  seedEncomendas() {
    const now = new Date();
    this.encomendas.push(
      {
        id: this.nextEncomendaId++,
        morador_id: 1,
        morador_nome: "Carlos Lima",
        morador_unidade: "Bl 05 - Apto 502",
        morador_telefone: "(11) 98765-4321",
        morador_whatsapp: "(11) 98765-4321",
        morador_telegram: "@carloslima502",
        codigo_rastreio: "BR98765432101",
        transportadora: "Mercado Livre",
        tipo_volume: "Caixa Média",
        local_armazenamento: "Armário A - Prateleira 2",
        observacoes: "Contém item frágil",
        codigo_retirada: "RET-8421",
        status: "pendente",
        recebido_em: new Date(now.getTime() - 3600 * 3000).toISOString(),
        recebido_por: "Portaria Central",
        retirado_em: null,
        retirado_por: null,
        notificacao_enviada_whatsapp: true,
        notificacao_enviada_telegram: true,
        mensagem_aviso: `📦 AMBROS - Encomenda Recebida!\nMorador: Carlos Lima (Bl 05 - Apto 502)\nTransportadora: Mercado Livre (BR98765432101)\nLocal: Armário A - Prateleira 2\nCódigo único para retirada: RET-8421\nApresente este código na portaria para retirar seu pacote.`,
      },
      {
        id: this.nextEncomendaId++,
        morador_id: 2,
        morador_nome: "Maria Oliveira",
        morador_unidade: "Bl 08 - Apto 103",
        morador_telefone: "(11) 91234-5678",
        morador_whatsapp: "(11) 91234-5678",
        morador_telegram: null,
        codigo_rastreio: "AMZ-993812",
        transportadora: "Amazon",
        tipo_volume: "Envelope A4",
        local_armazenamento: "Gaveta de Cartas 08",
        observacoes: null,
        codigo_retirada: "RET-1934",
        status: "entregue",
        recebido_em: new Date(now.getTime() - 3600 * 5000).toISOString(),
        recebido_por: "Portaria Central",
        retirado_em: new Date(now.getTime() - 3600 * 1000).toISOString(),
        retirado_por: "Maria Oliveira (Própria)",
        notificacao_enviada_whatsapp: true,
        notificacao_enviada_telegram: false,
        mensagem_aviso: `📦 AMBROS - Encomenda Recebida!\nMorador: Maria Oliveira (Bl 08 - Apto 103)\nTransportadora: Amazon (AMZ-993812)\nCódigo único para retirada: RET-1934\nApresente na portaria para retirar.`,
      },
      {
        id: this.nextEncomendaId++,
        morador_id: 1,
        morador_nome: "Carlos Lima",
        morador_unidade: "Bl 05 - Apto 502",
        morador_telefone: "(11) 98765-4321",
        morador_whatsapp: "(11) 98765-4321",
        morador_telegram: "@carloslima502",
        codigo_rastreio: "SHOPEE-554192",
        transportadora: "Shopee",
        tipo_volume: "Pacote Pequeno",
        local_armazenamento: "Armário B - Prateleira 1",
        observacoes: "Entrega expressa Shopee Xpress",
        codigo_retirada: "RET-5521",
        status: "pendente",
        recebido_em: new Date(now.getTime() - 3600 * 1200).toISOString(),
        recebido_por: "Portaria Central",
        retirado_em: null,
        retirado_por: null,
        notificacao_enviada_whatsapp: true,
        notificacao_enviada_telegram: true,
        mensagem_aviso: `📦 AMBROS - Encomenda Recebida!\nMorador: Carlos Lima (Bl 05 - Apto 502)\nTransportadora: Shopee (SHOPEE-554192)\nLocal: Armário B - Prateleira 1\nCódigo único para retirada: RET-5521\nApresente este código na portaria para retirar seu pacote.`,
      }
    );
  }

  seedPrestadores() {
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const pastDate = new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0];

    this.prestadores.push(
      {
        id: this.nextPrestadorId++,
        nome: "Marcos Ribeiro",
        documento: "22.333.444-5",
        tipo_documento: "RG",
        empresa: "Marmoraria Gran Prime",
        funcao: "Instalador de Bancadas",
        telefone: "(11) 97123-4567",
        foto_url: null,
        placa_veiculo: "KRP8B12",
        cracha_numero: "CR-012",
        tipo_vinculo: "unidade",
        bloco: "05",
        apartamento: "502",
        morador_autorizador_id: 1,
        morador_autorizador_nome: "Carlos Lima",
        data_inicio: today,
        data_fim: nextWeek,
        horario_permitido: "08:00 às 17:00 (Seg a Sex)",
        observacao: "Reforma da cozinha autorizada pelo síndico",
        presente: true,
        ativo: true,
        criado_em: new Date().toISOString(),
      },
      {
        id: this.nextPrestadorId++,
        nome: "Rodrigo Alcantara",
        documento: "333.444.555-66",
        tipo_documento: "CPF",
        empresa: "Claro Fibra",
        funcao: "Técnico de Instalação de Internet",
        telefone: "(11) 98899-0011",
        foto_url: null,
        placa_veiculo: "CLA4F90",
        cracha_numero: "CR-007",
        tipo_vinculo: "unidade",
        bloco: "08",
        apartamento: "103",
        morador_autorizador_id: 2,
        morador_autorizador_nome: "Maria Oliveira",
        data_inicio: today,
        data_fim: today,
        horario_permitido: "09:00 às 13:00",
        observacao: "Passagem de cabo óptico pelo duto central",
        presente: false,
        ativo: true,
        criado_em: new Date().toISOString(),
      },
      {
        id: this.nextPrestadorId++,
        nome: "Otávio Mendes",
        documento: "444.555.666-77",
        tipo_documento: "CPF",
        empresa: "Atlas Schindler",
        funcao: "Manutenção Preventiva de Elevadores",
        telefone: "(11) 95566-7788",
        foto_url: null,
        placa_veiculo: null,
        cracha_numero: "CR-ADM1",
        tipo_vinculo: "condominio",
        bloco: null,
        apartamento: null,
        morador_autorizador_id: null,
        morador_autorizador_nome: "Administração Condominial",
        data_inicio: pastDate,
        data_fim: nextWeek,
        horario_permitido: "Comercial livre",
        observacao: "Chamado técnico preventivo mensal",
        presente: false,
        ativo: true,
        criado_em: new Date().toISOString(),
      }
    );
  }

  seedOcorrencias() {
    const now = new Date();
    this.ocorrencias.push(
      {
        id: this.nextOcorrenciaId++,
        titulo: "Barulho excessivo após às 22h",
        categoria: "barulho",
        gravidade: "media",
        status: "em_analise",
        bloco: "05",
        apartamento: "502",
        morador_envolvido: "Carlos Lima",
        descricao: "Vizinho do 402 relatou som alto e arrasto de móveis às 23:45. Porteiro interfonou e o morador reduziu o volume.",
        acao_tomada: "Primeira advertência verbal realizada pelo interfone da portaria.",
        registrado_por: "Porteiro Silva",
        data_hora: new Date(now.getTime() - 86400000).toISOString(),
        resolvido_em: null,
      },
      {
        id: this.nextOcorrenciaId++,
        titulo: "Veículo estacionado ocupando faixa de manobra",
        categoria: "estacionamento",
        gravidade: "baixa",
        status: "resolvida",
        bloco: "10",
        apartamento: "201",
        morador_envolvido: "João Silva",
        descricao: "Veículo HB20 (XYZ9F87) estacionado fora do alinhamento da vaga V-078 dificultando a saída da vaga vizinha.",
        acao_tomada: "Morador contatado e reposicionou o automóvel de forma correta.",
        registrado_por: "Porteiro Santos",
        data_hora: new Date(now.getTime() - 3600000 * 5).toISOString(),
        resolvido_em: new Date(now.getTime() - 3600000 * 4).toISOString(),
      }
    );
  }

  seedRestricoes() {
    this.restricoes.push(
      {
        id: this.nextRestricaoId++,
        tipo_identificador: "cpf",
        valor_identificador: "999.888.777-66",
        nome_pessoa: "Marcos Vinicius de Souza",
        motivo: "Medida protetiva judicial deferida em favor de moradora da unidade Bloco 08 / 103.",
        instrucao_portaria: "PROIBIDA A ENTRADA SOB QUALQUER HIPÓTESE. Se tentar entrar, acionar o botão de pânico ou 190 imediatamente.",
        bloqueio_total: true,
        ativo: true,
        criado_por: "Síndico Geral",
        criado_em: new Date().toISOString(),
      },
      {
        id: this.nextRestricaoId++,
        tipo_identificador: "placa",
        valor_identificador: "PER9A99",
        nome_pessoa: "Veículo Não Identificado / Ex-inquilino Inadimplente",
        motivo: "Controle de acesso revogado. Portão de garagem não deve ser aberto para este veículo.",
        instrucao_portaria: "Solicitar identificação manual e autorização prévia da administração antes de liberar passagem.",
        bloqueio_total: false,
        ativo: true,
        criado_por: "Administração",
        criado_em: new Date().toISOString(),
      }
    );
  }

  seedReservas() {
    const today = new Date();
    const nextSaturday = new Date(today.getTime() + 4 * 86400000).toISOString().split("T")[0];
    const nextSunday = new Date(today.getTime() + 5 * 86400000).toISOString().split("T")[0];

    this.reservas.push(
      {
        id: this.nextReservaId++,
        espaco: "salao_festas",
        espaco_nome: "Salão de Festas Principal",
        data_reserva: nextSaturday,
        periodo: "noite",
        morador_id: 1,
        morador_nome: "Carlos Lima",
        bloco: "05",
        apartamento: "502",
        status: "confirmada",
        convidados_estimados: 35,
        observacoes: "Aniversário familiar",
        solicitado_em: new Date(today.getTime() - 86400000 * 2).toISOString(),
        aprovado_em: new Date(today.getTime() - 86400000).toISOString(),
        aprovado_por: "Administração",
      },
      {
        id: this.nextReservaId++,
        espaco: "churrasqueira_1",
        espaco_nome: "Espaço Gourmet & Churrasqueira 1",
        data_reserva: nextSunday,
        periodo: "tarde",
        morador_id: 2,
        morador_nome: "Maria Oliveira",
        bloco: "08",
        apartamento: "103",
        status: "confirmada",
        convidados_estimados: 15,
        observacoes: "Almoço de domingo com amigos",
        solicitado_em: new Date(today.getTime() - 86400000).toISOString(),
        aprovado_em: new Date(today.getTime() - 3600000 * 4).toISOString(),
        aprovado_por: "Administração",
      }
    );
  }

  seedComunicados() {
    const now = new Date();
    this.comunicados.push(
      {
        id: this.nextComunicadoId++,
        titulo: "Limpeza Preventiva das Caixas d'Água",
        categoria: "manutencao",
        conteudo: "Informamos que na próxima terça-feira, das 08h às 14h, será realizada a limpeza semestral dos reservatórios. Pedimos moderação no uso de água.",
        importante: true,
        publicado_por: "Síndico Geral",
        data_publicacao: new Date(now.getTime() - 86400000 * 2).toISOString(),
        ativo: true,
      },
      {
        id: this.nextComunicadoId++,
        titulo: "Convocação para Assembleia Geral Ordinária (AGO)",
        categoria: "assembleia",
        conteudo: "Ficam convocados todos os senhores condôminos para a AGO no dia 20 deste mês, no Salão de Festas, com pauta sobre prestação de contas e eleição de síndico.",
        importante: true,
        publicado_por: "Conselho Consultivo",
        data_publicacao: new Date(now.getTime() - 86400000 * 4).toISOString(),
        ativo: true,
      },
      {
        id: this.nextComunicadoId++,
        titulo: "Novas Regras para Uso da Piscina e Churrasqueira",
        categoria: "aviso_geral",
        conteudo: "Lembramos que o uso de caixas de som nas áreas da piscina é restrito a volume ambiente. O horário de término das churrasqueiras aos finais de semana é às 22h.",
        importante: false,
        publicado_por: "Administração",
        data_publicacao: new Date(now.getTime() - 86400000 * 6).toISOString(),
        ativo: true,
      }
    );
  }

  seedNotificacoes() {
    const now = new Date();
    this.notificacoes.push(
      {
        id: this.nextNotificacaoId++,
        morador_id: 1,
        tipo: "encomenda",
        titulo: "Nova Encomenda na Portaria",
        mensagem: "Seu pacote do Mercado Livre (BR98765432101) está disponível. Use o código RET-8421 para retirada.",
        canal: "whatsapp",
        enviado_em: new Date(now.getTime() - 3600000 * 3).toISOString(),
        lida: false,
        dados_adicionais: { codigo_retirada: "RET-8421", encomenda_id: 1 },
      },
      {
        id: this.nextNotificacaoId++,
        morador_id: 1,
        tipo: "reserva",
        titulo: "Reserva de Salão Confirmada!",
        mensagem: "Sua solicitação para o Salão de Festas no dia 06/10 foi aprovada pela administração.",
        canal: "app",
        enviado_em: new Date(now.getTime() - 86400000).toISOString(),
        lida: true,
        dados_adicionais: { reserva_id: 1 },
      }
    );
  }

  seedPreAutorizacoes() {
    const nextWeekend = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];
    this.preautorizacoes.push(
      {
        id: this.nextPreAutorizacaoId++,
        morador_id: 1,
        morador_nome: "Carlos Lima",
        bloco: "05",
        apartamento: "502",
        nome_visitante: "Mariana Alencar",
        documento_visitante: "444.333.222-11",
        placa_veiculo: "MAR2A26",
        data_prevista: nextWeekend,
        observacao: "Convidada para churrasco",
        codigo_acesso_qr: "QR-7104",
        status: "aguardando",
        criado_em: new Date().toISOString(),
      },
      {
        id: this.nextPreAutorizacaoId++,
        morador_id: 1,
        morador_nome: "Carlos Lima",
        bloco: "05",
        apartamento: "502",
        nome_visitante: "Eduardo Fonseca",
        documento_visitante: null,
        placa_veiculo: null,
        data_prevista: nextWeekend,
        observacao: "Familiar visitante",
        codigo_acesso_qr: "QR-3891",
        status: "aguardando",
         criado_em: new Date().toISOString(),
      }
    );
  }

  // ===================================================================
  // Multi-tenant seed: gerar dados para todos os tenants usando seeds/generate.ts
  // ===================================================================
  seedMultiTenant() {
    const allTenantData = generate(this.tenantConfigs);

    for (const tenant of this.tenantConfigs) {
      const data = allTenantData[tenant.slug];
      this.tenantData.set(tenant.slug, data);
    }

    // Manter arrays flat com dados do primeiro tenant para compatibilidade com rotas existentes
    const primeiroTenant = this.tenantConfigs[0];
    const primeiro = this.tenantData.get(primeiroTenant.slug);
    if (primeiro) {
      this.moradores = primeiro.moradores;
      this.veiculos = primeiro.veiculos;
      this.visitantes = primeiro.visitantes;
      this.acessos = primeiro.acessos;
      this.encomendas = primeiro.encomendas;
      this.prestadores = primeiro.prestadores;
      this.ocorrencias = primeiro.ocorrencias;
      this.restricoes = primeiro.restricoes;
      this.reservas = primeiro.reservas;
      this.comunicados = primeiro.comunicados;
      this.notificacoes = primeiro.notificacoes;
      this.preautorizacoes = primeiro.preautorizacoes;
    }
  }

  // Garante que os usuarios de demo existam mesmo quando carregando do database.json
  ensureDemoUsers() {
    const demoUsers = [
       { email: "adm@adm.com", nome: "Administrador", senha_hash: "123", perfil: "administrador" },
       { email: "portaria@ambros.com", nome: "Porteiro", senha_hash: "123", perfil: "portaria" },
       { email: "carlos@ambros.com", nome: "Carlos Lima", senha_hash: "123", perfil: "morador" },
       { email: "sindico@ambros.com", nome: "Sindico", senha_hash: "123", perfil: "sindico" },
    ];

    for (const du of demoUsers) {
      const exists = this.usuarios.find((u) => u.email === du.email);
      if (!exists) {
        this.usuarios.push({
          id: this.nextUserId++,
          nome: du.nome,
          email: du.email,
          senha_hash: du.senha_hash,
          perfil: du.perfil,
          ativo: true,
          criado_em: new Date().toISOString(),
        });
      }
    }
  }

  seedLeads() {
    const now = new Date();
    this.leads.push(
      {
        id: this.nextLeadId++,
        nome: "João Mendes",
        email: "joao.mendes@email.com",
        telefone: "(11) 99999-8877",
        condominio_nome: "Residencial Jardim das Acácias",
        numero_unidades: 48,
        sistema_atual: "Planilha Excel + WhatsApp",
        status: "novo",
        origem: "landing-page",
        observacao: "Interessado em controle de visitantes e encomendas",
        criado_em: now.toISOString(),
        atualizado_em: now.toISOString(),
      }
    );
  }

  getNextMoradorId() {
    return this.nextMoradorId++;
  }
  getNextVeiculoId() {
    return this.nextVeiculoId++;
  }
  getNextVisitanteId() {
    return this.nextVisitanteId++;
  }
  getNextAcessoId() {
    return this.nextAcessoId++;
  }
  getNextEncomendaId() {
    return this.nextEncomendaId++;
  }
  getNextPrestadorId() {
    return this.nextPrestadorId++;
  }
  getNextOcorrenciaId() {
    return this.nextOcorrenciaId++;
  }
  getNextRestricaoId() {
    return this.nextRestricaoId++;
  }
  getNextReservaId() {
    return this.nextReservaId++;
  }
  getNextComunicadoId() {
    return this.nextComunicadoId++;
  }
  getNextNotificacaoId() {
    return this.nextNotificacaoId++;
  }
  getNextPreAutorizacaoId() {
    return this.nextPreAutorizacaoId++;
  }
  rebaseIds() {
    const maxId = (arr: { id: number }[]) =>
      arr.reduce((max, item) => Math.max(max, item.id), 0);
    this.nextUserId = maxId(this.usuarios) + 1;
    this.nextMoradorId = maxId(this.moradores) + 1;
    this.nextVeiculoId = maxId(this.veiculos) + 1;
    this.nextVisitanteId = maxId(this.visitantes) + 1;
    this.nextAcessoId = maxId(this.acessos) + 1;
    this.nextEncomendaId = maxId(this.encomendas) + 1;
    this.nextPrestadorId = maxId(this.prestadores) + 1;
    this.nextOcorrenciaId = maxId(this.ocorrencias) + 1;
    this.nextRestricaoId = maxId(this.restricoes) + 1;
    this.nextReservaId = maxId(this.reservas) + 1;
    this.nextComunicadoId = maxId(this.comunicados) + 1;
    this.nextNotificacaoId = maxId(this.notificacoes) + 1;
    this.nextPreAutorizacaoId = maxId(this.preautorizacoes) + 1;
    this.nextLeadId = maxId(this.leads) + 1;
  }
  getNextLeadId() {
    return this.nextLeadId++;
  }

  __resetDb() {
    this.usuarios = [];
    this.moradores = [];
    this.veiculos = [];
    this.visitantes = [];
    this.acessos = [];
    this.encomendas = [];
    this.prestadores = [];
    this.ocorrencias = [];
    this.restricoes = [];
    this.reservas = [];
    this.comunicados = [];
    this.notificacoes = [];
    this.preautorizacoes = [];
    this.leads = [];
    this.nextUserId = 1;
    this.nextMoradorId = 1;
    this.nextVeiculoId = 1;
    this.nextVisitanteId = 1;
    this.nextAcessoId = 1;
    this.nextEncomendaId = 1;
    this.nextPrestadorId = 1;
    this.nextOcorrenciaId = 1;
    this.nextRestricaoId = 1;
    this.nextReservaId = 1;
    this.nextComunicadoId = 1;
    this.nextNotificacaoId = 1;
    this.nextPreAutorizacaoId = 1;
    this.nextLeadId = 1;
    this.seed();
    this.seedMultiTenant();
    if (this.moradores.length > 0) {
      this.moradores[0].cpf = "123.456.789-00";
      this.moradores[0].bloco = "05";
      this.moradores[0].apartamento = "502";
      this.moradores[0].telegram = "@carloslima502";
      this.moradores[0].nome_completo = "Carlos Lima";
    }
    this.rebaseIds();
  }
}

export const db = new InMemoryDB();
export function __resetDb() {
  db.__resetDb();
}
