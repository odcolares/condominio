import { Usuario, Morador, Veiculo, Visitante, Acesso, Encomenda } from "./types.js";
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

  private nextUserId = 1;
  private nextMoradorId = 1;
  private nextVeiculoId = 1;
  private nextVisitanteId = 1;
  private nextAcessoId = 1;
  private nextEncomendaId = 1;

  constructor() {
    this.init();
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
          this.nextUserId = parsed.nextUserId || (this.usuarios.length + 1);
          this.nextMoradorId = parsed.nextMoradorId || (this.moradores.length + 1);
          this.nextVeiculoId = parsed.nextVeiculoId || (this.veiculos.length + 1);
          this.nextVisitanteId = parsed.nextVisitanteId || (this.visitantes.length + 1);
          this.nextAcessoId = parsed.nextAcessoId || (this.acessos.length + 1);
          this.nextEncomendaId = parsed.nextEncomendaId || (this.encomendas.length + 1);
          return;
        }
      }
    } catch (err) {
      console.warn("Falha ao carregar banco do disco, inicializando com sementes:", err);
    }

    this.seed();
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
        nextUserId: this.nextUserId,
        nextMoradorId: this.nextMoradorId,
        nextVeiculoId: this.nextVeiculoId,
        nextVisitanteId: this.nextVisitanteId,
        nextAcessoId: this.nextAcessoId,
        nextEncomendaId: this.nextEncomendaId,
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

    // Default admin
    this.usuarios.push({
      id: this.nextUserId++,
      nome: "Administrador",
      email: "adm@adm.com",
      senha_hash: "123", // For simplicity & compatibility with original adm@adm.com / 123
      perfil: "admin",
      ativo: true,
      criado_em: now.toISOString(),
    });

    // Seed Moradores
    const carlos: Morador = {
      id: this.nextMoradorId++,
      nome_completo: "Carlos Lima",
      cpf: "123.456.789-00",
      telefone: "(11) 98765-4321",
      whatsapp: "(11) 98765-4321",
      bloco: "05",
      apartamento: "502",
      vinculo: "proprietario",
      foto_url: null,
      numero_vaga: "V-045",
      ativo: true,
      criado_em: now.toISOString(),
    };

    const maria: Morador = {
      id: this.nextMoradorId++,
      nome_completo: "Maria Oliveira",
      cpf: "987.654.321-00",
      telefone: "(11) 91234-5678",
      whatsapp: null,
      bloco: "08",
      apartamento: "103",
      vinculo: "inquilino",
      foto_url: null,
      numero_vaga: "V-112",
      ativo: true,
      criado_em: now.toISOString(),
    };

    const joao: Morador = {
      id: this.nextMoradorId++,
      nome_completo: "João Silva",
      cpf: "456.789.123-00",
      telefone: "(11) 99887-7665",
      whatsapp: null,
      bloco: "10",
      apartamento: "201",
      vinculo: "proprietario",
      foto_url: null,
      numero_vaga: "V-078",
      ativo: true,
      criado_em: now.toISOString(),
    };

    this.moradores.push(carlos, maria, joao);

    // Seed Veiculos
    this.veiculos.push(
      {
        id: this.nextVeiculoId++,
        placa: "ABC1D23",
        modelo: "Onix",
        cor: "Prata",
        vaga: "V-045",
        morador_id: carlos.id,
        criado_em: now.toISOString(),
      },
      {
        id: this.nextVeiculoId++,
        placa: "XYZ9F87",
        modelo: "HB20",
        cor: "Preto",
        vaga: "V-078",
        morador_id: joao.id,
        criado_em: now.toISOString(),
      }
    );

    // Seed Visitantes
    const jose: Visitante = {
      id: this.nextVisitanteId++,
      nome: "José Santos",
      documento: "111.222.333-44",
      tipo_documento: "CPF",
      telefone: null,
      foto_url: null,
      placa_veiculo: "ABC1D23",
      vaga: null,
      bloco: "10",
      apartamento: "201",
      morador_visitado_id: joao.id,
      agendado_para: null,
      presente: true,
      criado_em: now.toISOString(),
    };

    const ana: Visitante = {
      id: this.nextVisitanteId++,
      nome: "Ana Paula",
      documento: "555.666.777-88",
      tipo_documento: "CPF",
      telefone: null,
      foto_url: null,
      placa_veiculo: null,
      vaga: null,
      bloco: "08",
      apartamento: "103",
      morador_visitado_id: maria.id,
      agendado_para: null,
      presente: true,
      criado_em: now.toISOString(),
    };

    this.visitantes.push(jose, ana);

    // Seed Acessos
    const m10 = new Date(now.getTime() - 10 * 60000).toISOString();
    const m21 = new Date(now.getTime() - 21 * 60000).toISOString();
    const m23 = new Date(now.getTime() - 23 * 60000).toISOString();
    const m29 = new Date(now.getTime() - 29 * 60000).toISOString();

    this.acessos.push(
      {
        id: this.nextAcessoId++,
        tipo_pessoa: "morador",
        pessoa_id: carlos.id,
        nome: carlos.nome_completo,
        sentido: "entrada",
        placa_veiculo: "ABC1D23",
        vaga: "V-045",
        observacao: null,
        registrado_em: m10,
      },
      {
        id: this.nextAcessoId++,
        tipo_pessoa: "visitante",
        pessoa_id: jose.id,
        nome: jose.nome,
        sentido: "entrada",
        placa_veiculo: "ABC1D23",
        vaga: null,
        observacao: null,
        registrado_em: m21,
      },
      {
        id: this.nextAcessoId++,
        tipo_pessoa: "morador",
        pessoa_id: maria.id,
        nome: maria.nome_completo,
        sentido: "saida",
        placa_veiculo: null,
        vaga: null,
        observacao: null,
        registrado_em: m23,
      },
      {
        id: this.nextAcessoId++,
        tipo_pessoa: "morador",
        pessoa_id: joao.id,
        nome: joao.nome_completo,
        sentido: "entrada",
        placa_veiculo: "XYZ9F87",
        vaga: "V-078",
        observacao: null,
        registrado_em: m29,
      }
    );

    // Seed Encomendas
    this.encomendas.push(
      {
        id: this.nextEncomendaId++,
        morador_id: carlos.id,
        morador_nome: carlos.nome_completo,
        morador_unidade: `Bloco ${carlos.bloco} - Apto ${carlos.apartamento}`,
        morador_telefone: carlos.telefone,
        morador_whatsapp: carlos.whatsapp,
        morador_telegram: "@carloslima",
        codigo_rastreio: "BR839210492AA",
        transportadora: "Mercado Livre",
        tipo_volume: "Caixa Média",
        local_armazenamento: "Armário A - Prateleira 2",
        observacoes: "Entregue pela van amarela do Mercado Livre",
        codigo_retirada: "RET-8421",
        status: "pendente",
        recebido_em: new Date(Date.now() - 3600 * 2000).toISOString(),
        recebido_por: "Portaria Central",
        retirado_em: null,
        retirado_por: null,
        notificacao_enviada_whatsapp: true,
        notificacao_enviada_telegram: true,
        mensagem_aviso: `📦 AMBROS - Encomenda Recebida!\nMorador: Carlos Lima (Bl 05 - Apto 502)\nTransportadora: Mercado Livre (BR839210492AA)\nCódigo único para retirada: RET-8421\nApresente na portaria para retirar.`
      },
      {
        id: this.nextEncomendaId++,
        morador_id: maria.id,
        morador_nome: maria.nome_completo,
        morador_unidade: `Bloco ${maria.bloco} - Apto ${maria.apartamento}`,
        morador_telefone: maria.telefone,
        morador_whatsapp: "(11) 91234-5678",
        morador_telegram: null,
        codigo_rastreio: "AMZ-993812",
        transportadora: "Amazon",
        tipo_volume: "Envelope",
        local_armazenamento: "Guichê Principal",
        observacoes: "Livros",
        codigo_retirada: "RET-1934",
        status: "entregue",
        recebido_em: new Date(Date.now() - 3600 * 5000).toISOString(),
        recebido_por: "Portaria Central",
        retirado_em: new Date(Date.now() - 3600 * 1000).toISOString(),
        retirado_por: "Maria Oliveira (Própria)",
        notificacao_enviada_whatsapp: true,
        notificacao_enviada_telegram: false,
        mensagem_aviso: `📦 AMBROS - Encomenda Recebida!\nMorador: Maria Oliveira (Bl 08 - Apto 103)\nTransportadora: Amazon (AMZ-993812)\nCódigo único para retirada: RET-1934\nApresente na portaria para retirar.`
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
}

export const db = new InMemoryDB();
