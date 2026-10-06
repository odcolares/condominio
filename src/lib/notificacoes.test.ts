import { describe, it, expect } from "vitest";
import {
  normalizarFone,
  normalizarTelegram,
  gerarLinksNotificacao,
  unidadeMorador,
  tmplEncomenda,
  tmplVisita,
  tmplVisitaSaida,
  tmplReserva,
  tmplPrestador,
  tmplOcorrencia,
  DestinoNotificacao,
} from "./notificacoes.js";
import { Morador, Encomenda, Visitante, Reserva, Prestador, Ocorrencia } from "../types.js";

describe("normalizarFone", () => {
  it("adds DDI 55 to a 11-digit number and removes 9th digit", () => {
    expect(normalizarFone("11987654321")).toBe("551187654321");
  });

  it("removes the 9th digit and adds DDI", () => {
    expect(normalizarFone("(11) 98765-4321")).toBe("551187654321");
  });

  it("keeps a 10-digit number and adds DDI", () => {
    expect(normalizarFone("(11) 8765-4321")).toBe("551187654321");
  });

  it("strips DDI 55 and 9th digit from full international number", () => {
    expect(normalizarFone("5511987654321")).toBe("551187654321");
  });

  it("keeps 9th digit when number is 9 digits (mobile without DDD)", () => {
    expect(normalizarFone("987654321")).toBe("55987654321");
  });

  it("returns null for empty input", () => {
    expect(normalizarFone("")).toBe(null);
    expect(normalizarFone(null)).toBe(null);
    expect(normalizarFone(undefined)).toBe(null);
  });

  it("returns null for non-numeric string", () => {
    expect(normalizarFone("abc")).toBe(null);
  });
});

describe("normalizarTelegram", () => {
  it("strips @ from username", () => {
    expect(normalizarTelegram("@carloslima")).toBe("carloslima");
  });

  it("handles username without @", () => {
    expect(normalizarTelegram("joaosilva")).toBe("joaosilva");
  });

  it("handles multiple @", () => {
    expect(normalizarTelegram("@@user")).toBe("user");
  });

  it("returns null for empty input", () => {
    expect(normalizarTelegram("")).toBe(null);
    expect(normalizarTelegram(null)).toBe(null);
    expect(normalizarTelegram(undefined)).toBe(null);
  });
});

describe("gerarLinksNotificacao", () => {
  it("generates WhatsApp URL from whatsapp field", () => {
    const destino: DestinoNotificacao = {
      whatsapp: "(11) 98765-4321",
      telefone: null,
      telegram: null,
    };
    const links = gerarLinksNotificacao(destino, "Teste de mensagem");
    expect(links.whatsappUrl).toContain("https://api.whatsapp.com/send?phone=551187654321");
    expect(links.whatsappUrl).toContain("text=");
  });

  it("generates Telegram direct URL when username is set", () => {
    const destino: DestinoNotificacao = {
      whatsapp: null,
      telefone: null,
      telegram: "@carloslima502",
    };
    const links = gerarLinksNotificacao(destino, "Olá!");
    expect(links.telegramUrl).toBe("https://t.me/carloslima502");
  });

  it("falls back to Telegram share URL when no username", () => {
    const destino: DestinoNotificacao = {
      whatsapp: null,
      telefone: null,
      telegram: null,
    };
    const links = gerarLinksNotificacao(destino, "Compartilhar");
    expect(links.telegramUrl).toContain("https://t.me/share/url?url=");
  });

  it("returns null whatsappUrl when no phone or whatsapp", () => {
    const destino: DestinoNotificacao = {
      whatsapp: null,
      telefone: null,
      telegram: "@user",
    };
    const links = gerarLinksNotificacao(destino, "msg");
    expect(links.whatsappUrl).toBe(null);
  });

  it("uses whatsapp field over telefone when both present", () => {
    const destino: DestinoNotificacao = {
      whatsapp: "(11) 91234-5678",
      telefone: "(11) 98765-4321",
      telegram: null,
    };
    const links = gerarLinksNotificacao(destino, "msg");
    expect(links.whatsappUrl).toContain("551112345678");
  });

  it("falls back to telefone when whatsapp is null", () => {
    const destino: DestinoNotificacao = {
      whatsapp: null,
      telefone: "(11) 98765-4321",
      telegram: null,
    };
    const links = gerarLinksNotificacao(destino, "msg");
    expect(links.whatsappUrl).toContain("551187654321");
  });
});

describe("unidadeMorador", () => {
  it("formats bloco and apartamento", () => {
    const m = { bloco: "05", apartamento: "502" } as Morador;
    expect(unidadeMorador(m)).toBe("Bloco 05 / Apt 502");
  });

  it("uses fallback for null values", () => {
    const m = { bloco: null, apartamento: null } as Morador;
    expect(unidadeMorador(m)).toBe("Bloco — / Apt —");
  });
});

describe("Templates", () => {
  const morador = {
    id: 1,
    nome_completo: "Carlos Lima",
    cpf: "",
    telefone: null,
    whatsapp: "(11) 98765-4321",
    telegram: "@carloslima502",
    bloco: "05",
    apartamento: "502",
    vinculo: "proprietario",
    foto_url: null,
    numero_vaga: null,
    ativo: true,
    criado_em: new Date().toISOString(),
  } as Morador;

  describe("tmplEncomenda", () => {
    it("includes codigo_retirada, transportadora, and morador_unidade", () => {
      const enc = {
        id: 1, morador_id: 1, morador_nome: "Carlos Lima",
        morador_unidade: "Bloco 05 - Apto 502", morador_telefone: null,
        morador_whatsapp: "(11) 98765-4321", morador_telegram: "@carloslima502",
        codigo_rastreio: "BR98765432101", transportadora: "Mercado Livre",
        tipo_volume: "Caixa Média", local_armazenamento: "Armário A",
        observacoes: null, codigo_retirada: "RET-8421", status: "pendente",
        recebido_em: new Date().toISOString(), recebido_por: "Portaria",
        retirado_em: null, retirado_por: null,
        notificacao_enviada_whatsapp: false, notificacao_enviada_telegram: false,
        mensagem_aviso: "",
      } as Encomenda;
      const msg = tmplEncomenda(morador, enc);
      expect(msg).toContain("RET-8421");
      expect(msg).toContain("Mercado Livre");
      expect(msg).toContain("BR98765432101");
      expect(msg).toContain("Bloco 05 - Apto 502");
      expect(msg).toContain("código de retirada");
    });

    it("includes observacoes when present", () => {
      const enc = {
        id: 1, morador_id: 1, morador_nome: "Carlos Lima",
        morador_unidade: "Bloco 05 - Apto 502", morador_telefone: null,
        morador_whatsapp: null, morador_telegram: null,
        codigo_rastreio: null, transportadora: null,
        tipo_volume: null, local_armazenamento: null,
        observacoes: "Produto frágil", codigo_retirada: "RET-9999", status: "pendente",
        recebido_em: new Date().toISOString(), recebido_por: "Portaria",
        retirado_em: null, retirado_por: null,
        notificacao_enviada_whatsapp: false, notificacao_enviada_telegram: false,
        mensagem_aviso: "",
      } as Encomenda;
      const msg = tmplEncomenda(morador, enc);
      expect(msg).toContain("Produto frágil");
    });
  });

  describe("tmplVisita", () => {
    it("includes visitor name and unit", () => {
      const v = {
        id: 1, nome: "João Visitor", documento: null, tipo_documento: null,
        telefone: null, foto_url: null, placa_veiculo: null, vaga: null,
        bloco: "05", apartamento: "502", morador_visitado_id: 1,
        agendado_para: null, presente: true, criado_em: new Date().toISOString(),
      } as Visitante;
      const msg = tmplVisita(morador, v);
      expect(msg).toContain("João Visitor");
      expect(msg).toContain("Bloco 05 / Apt 502");
    });
  });

  describe("tmplVisitaSaida", () => {
    it("includes visitor name and 'saiu' text", () => {
      const v = { id: 1, nome: "Maria Visitante", documento: null, tipo_documento: null,
        telefone: null, foto_url: null, placa_veiculo: null, vaga: null,
        bloco: "05", apartamento: "502", morador_visitado_id: 1,
        agendado_para: null, presente: false, criado_em: new Date().toISOString(),
      } as Visitante;
      const msg = tmplVisitaSaida(morador, v);
      expect(msg).toContain("Maria Visitante");
      expect(msg.toLowerCase()).toContain("saiu");
    });
  });

  describe("tmplReserva", () => {
    it("includes space name, unit, and confirmation status", () => {
      const r = {
        id: 1, espaco: "salao_festas", espaco_nome: "Salão de Festas Principal",
        data_reserva: "2026-10-10", periodo: "noite", morador_id: 1,
        morador_nome: "Carlos Lima", bloco: "05", apartamento: "502",
        status: "confirmada", convidados_estimados: 30,
        observacoes: null, solicitado_em: new Date().toISOString(),
        aprovado_em: new Date().toISOString(), aprovado_por: "Admin",
      } as Reserva;
      const msg = tmplReserva(morador, r, true);
      expect(msg).toContain("Salão de Festas Principal");
      expect(msg).toContain("10/10/2026");
      expect(msg).toContain("confirmada");
      expect(msg).toContain("30 convidados");
    });
  });

  describe("tmplPrestador", () => {
    it("includes name, function, empresa, and unit for unidade vinculo", () => {
      const p = {
        id: 1, nome: "Marcos Ribeiro", documento: "22.333.444-5", tipo_documento: "RG",
        empresa: "Marmoraria Gran Prime", funcao: "Instalador", telefone: null,
        foto_url: null, placa_veiculo: "KRP8B12", cracha_numero: "CR-012",
        tipo_vinculo: "unidade", bloco: "05", apartamento: "502",
        morador_autorizador_id: 1, morador_autorizador_nome: "Carlos Lima",
        data_inicio: "2026-10-01", data_fim: "2026-10-08",
        horario_permitido: "08h-17h", observacao: null, presente: true,
        ativo: true, criado_em: new Date().toISOString(),
      } as Prestador;
      const msg = tmplPrestador(morador, p, "entrou");
      expect(msg).toContain("Marcos Ribeiro");
      expect(msg).toContain("entrou no condomínio");
      expect(msg.toLowerCase()).toContain("instalador");
      expect(msg).toContain("Marmoraria Gran Prime");
      expect(msg).toContain("Bloco 05 / Apt 502");
    });
  });

  describe("tmplOcorrencia", () => {
    it("includes title, severity, and unit info", () => {
      const ocor = {
        id: 1, titulo: "Barulho excessivo", categoria: "barulho",
        gravidade: "media", status: "aberta", bloco: "05", apartamento: "502",
        morador_envolvido: "Carlos Lima", descricao: "Som alto após 22h",
        acao_tomada: "Advertido", registrado_por: "Porteiro",
        data_hora: new Date().toISOString(), resolvido_em: null,
      } as Ocorrencia;
      const msg = tmplOcorrencia(morador, ocor);
      expect(msg).toContain("Barulho excessivo");
      expect(msg).toContain("media");
      expect(msg).toContain("Bloco 05 / Apt 502");
    });
  });
});
