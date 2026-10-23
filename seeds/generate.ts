// seeds/generate.ts
//
// Gerador de seeds - Condominio Multi-Tenant
// S3: moradores + veiculos + prestadores
// S4: visitantes, acessos, encomendas, ocorrencias, restricoes, reservas, comunicados, notificacoes, pre-autorizacoes
//
// Regras importantes:
// - IDs sequenciais e unicos dentro do tenant
// - Veiculos com morador_id NULO sao visitantes ou especulativos
// - Prestadores com tipo_vinculo=unidade precisam morador_autorizador_id valido

import { pick, intBetween, chance } from './rng';
import { FIRST_NAMES, LAST_NAMES, generateCpf, generatePhone, generatePlate, generateTelegram } from './names';
import { Morador, Veiculo, Visitante, Acesso, Encomenda, Ocorrencia, Restricao, Reserva, Comunicado, NotificacaoMorador, PreAutorizacaoVisitante, Prestador, EspacoComum } from '../src/types';
import { TenantConfig, TENANTS } from '../src/tenant';
import { makeRng } from './rng';

// ===================================================================
// Helper functions
// ==================================================================/

export function dateBetween(start: Date, end: Date, balance: () => number): string {
  const t0 = start.getTime();
  const t1 = end.getTime();
  const t = t0 + Math.floor(balance() * (t1 - t0 + 1));
  const d = new Date(t);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

export function createdAt(rng: () => number, balance: () => number): string {
  const date = dateBetween(
    new Date('2023-01-01T00:00:00Z'),
    new Date('2026-12-31T23:59:59Z'),
    balance,
  );
  return date;
}

export function buildingUnit(rng: () => number): string {
  return String(intBetween(1, 6, rng));
}

// ===================================================================
// S3: MORADORES
// ==================================================================/

export function generateMoradores(tenant: TenantConfig, balance: () => number): Morador[] {
  const moradores: Morador[] = [];
  const blockCount = tenant.blocos.length;
  for (let i = 0; i < tenant.unidades; i++) {
    const block = tenant.blocos[i % blockCount];
    const apt = buildingUnit(balance);
    const isProprietario = chance(40, balance);
    moradores.push({
      id: moradores.length + 1,
      nome_completo: FIRST_NAMES[balance()] + ' ' + LAST_NAMES[balance()],
      cpf: generateCpf(balance),
      telefone: generatePhone('am', balance),
      whatsapp: generatePhone('am', balance),
      telegram: generateTelegram(FIRST_NAMES[balance()], LAST_NAMES[balance()], balance),
      bloco: block,
      apartamento: apt,
      vinculo: isProprietario ? 'proprietario' : 'inquilino',
      foto_url: null,
      numero_vaga: pick(['A1', 'A2', 'B3', 'C4', 'D5', 'E6'], balance),
      ativo: true,
      criado_em: createdAt(balance, balance),
    });
  }
  return moradores;
}

// ===================================================================
// S3: VEICULOS
// ==================================================================/

export function generateVeiculos(tenant: TenantConfig, moradores: Morador[], balance: () => number): Veiculo[] {
  const veiculos: Veiculo[] = [];

  for (let i = 0; i < tenant.vagas; i++) {
    const moradorId = i < moradores.length ? moradores[i].id : null;
    const tipoVinculo: 'proprietario' | 'visitante' | 'especulativo' = pick(['proprietario', 'visitante', 'especulativo'], balance);
    const placa = generatePlate(balance);
    const cor = pick(['Prata', 'Preto', 'Branco', 'Vermelho', 'Azul'], balance);
    const modelo = pick(['Fusca', 'Gol', 'Onix', 'Cerato', 'Hilux'], balance);
    const proprietario = moradores[Math.floor(balance() * moradores.length)];
    veiculos.push({
      id: veiculos.length + 1,
      morador_id: moradorId,
      placa: placa,
      cor: cor,
      modelo: modelo,
      tipo_vinculo: tipoVinculo,
      vaga: pick(['VAGA-01', 'VAGA-02', 'VAGA-03', 'VAGA-04', 'VAGA-05'], balance),
      titulo: tipoVinculo === 'proprietario' ? proprietario.nome_completo : null,
      criado_em: createdAt(balance, balance),
    });
  }
  return veiculos;
}
// ===================================================================
// S4: VISITANTES
// ==================================================================/

export function generateVisitantes(tenant: TenantConfig, moradores: Morador[], balance: () => number): Visitante[] {
  const visitantes: Visitante[] = [];
  const qtd = tenant.registros.visitantes;
  for (let i = 0; i < qtd; i++) {
    const morador_visitado = moradores[Math.floor(balance() * moradores.length)];
    const morador_visitado_nome = morador_visitado.nome_completo;
    const moradorId = morador_visitado.id;
    const bloco = tenant.blocos[Math.floor(balance() * tenant.blocos.length)];
    const apt = buildingUnit(balance);
    const nome = FIRST_NAMES[balance()] + ' ' + LAST_NAMES[balance()];
    const documento = pick(['123.456.789-00', '999.999.999-99', '111.111.111-11'], balance);
    const tipoDocumento: 'CPF' | 'RG' | 'CNH' | 'Outro' = pick(['CPF', 'CNH', 'Outro'], balance);
    const telefone = generatePhone('am', balance);
    const plate = generatePlate(balance);
    const vaga = pick(['VAGA-01', 'VAGA-02', 'VAGA-03', 'VAGA-04', 'VAGA-05'], balance);
    const dataPrevista = dateBetween(
      new Date('2024-01-01'),
      new Date('2026-12-31'),
      balance,
    );
    const observacao = pick(['Visita de entrega', 'Visita de manutencao', 'Visita familiar', 'Visitante oficial'], balance);
    visitantes.push({
      id: visitantes.length + 1,
      nome: morador_visitado_nome,
      documento: generateCpf(balance),
      telefone: generatePhone('am', balance),
      foto_url: null,
      morador_visitado_id: moradorId,
      bloco: bloco,
      apartamento: apt,
      nome_visitante: nome,
      documento_visitante: documento,
      tipo_documento: tipoDocumento,
      placa_veiculo: plate,
      vaga: vaga,
      data_prevista: dataPrevista,
      observacao: observacao,
      presente: false,
      criado_em: createdAt(balance, balance),
      agendado_para: dateBetween(new Date('2024-01-01'), new Date('2026-12-31'), balance),
    });
  }
  return visitantes;
}

// ===================================================================
// S4: ACESSOS
// ==================================================================/

export function generateAcessos(tenant: TenantConfig, moradores: Morador[], veiculos: Veiculo[], balance: () => number): Acesso[] {
  const acessos: Acesso[] = [];
  const qtd = tenant.registros.acessos;
  for (let i = 0; i < qtd; i++) {
    const tipoPessoa: 'morador' | 'visitante' | 'funcionario' | 'prestador' = pick(['morador', 'visitante', 'funcionario', 'prestador'], balance);
    let pessoaId = 0;
    let nome = '';
    let placaVeiculo = '';
    let sentido: 'entrada' | 'saida' = pick(['entrada', 'saida'], balance);
    
    if (tipoPessoa === 'morador') {
      const m = moradores[Math.floor(balance() * moradores.length)];
      pessoaId = m.id;
      nome = m.nome_completo;
    } else if (tipoPessoa === 'visitante') {
      pessoaId = Math.floor(balance() * 100) % 1000 + 1;
      nome = 'Visitante ' + pessoaId;
    } else if (tipoPessoa === 'prestador') {
      pessoaId = Math.floor(balance() * 50) % 50 + 1;
      nome = 'Prestador ' + pessoaId;
    }
    
    if (tipoPessoa !== 'morador') {
      const v = veiculos[Math.floor(balance() * veiculos.length)];
      placaVeiculo = v.placa || '';
    }
    
    const vaga = pick(['VAGA-01', 'VAGA-02', 'VAGA-03', 'VAGA-04', 'VAGA-05', 'G01', 'G02', 'G03', 'G04', 'G05'], balance);
    const dataAcesso = dateBetween(
      new Date('2024-01-01'),
      new Date('2026-12-31'),
      balance,
    );
    const observacao = pick(['Entrada rotineira', 'Entrega de encomenda', 'Manutencao', 'Visita tecnica'], balance);
    
    acessos.push({
      id: acessos.length + 1,
      tipo_pessoa: tipoPessoa,
      pessoa_id: pessoaId,
      nome: nome,
      sentido: sentido,
      placa_veiculo: placaVeiculo,
      vaga: vaga,
      observacao: observacao,
      registrado_em: dataAcesso,
    });
  }
  return acessos;
}
// ===================================================================
// S4: ENCOMENDAS
// ==================================================================/

export function generateEncomendas(tenant: TenantConfig, moradores: Morador[], balance: () => number): Encomenda[] {
  const encomendas: Encomenda[] = [];
  const qtd = tenant.registros.encomendas;
  for (let i = 0; i < qtd; i++) {
    const morador = moradores[Math.floor(balance() * moradores.length)];
    const status: 'pendente' | 'entregue' | 'devolvida' = pick(['pendente', 'entregue', 'devolvida'], balance);
    const dataCriacao = dateBetween(
      new Date('2024-01-01'),
      new Date('2026-12-31'),
      balance,
    );
    const dataEntrega = status === 'entregue'
      ? new Date(dataCriacao).getTime() + 86400000 * intBetween(1, 7, balance)
      : null;

    encomendas.push({
      id: encomendas.length + 1,
      morador_id: morador.id,
      morador_nome: morador.nome_completo,
      morador_unidade: morador.bloco + '-' + morador.apartamento,
      morador_telefone: morador.telefone || null,
      morador_whatsapp: morador.whatsapp || null,
      morador_telegram: morador.telegram || null,
      codigo_rastreio: pick(['CR-1000', 'CR-1001', 'CR-1002', 'CR-1003', 'CR-1004'], balance),
      transportadora: pick(['Correios', 'Uberlandia', 'FedEx', 'DHL', 'Amazon Transport'], balance),
      tipo_volume: pick(['Pequeno', 'M', 'Grande', 'Extra Grande'], balance),
      local_armazenamento: pick(['Gaveta 1', 'Gaveta 2', 'Gaveta 3', 'Area de coleta'], balance),
      observacoes: pick(['Nenhuma', 'Entrega preferencial', 'Fragil', 'Perecivel'], balance),
      codigo_retirada: pick(['QR-100', 'QR-101', 'QR-102', 'QR-103'], balance),
      status: status,
      recebido_em: status === 'entregue' ? new Date(dataEntrega).toISOString() : null,
      recebido_por: status === 'entregue' ? 'Portaria' : null,
      retirado_em: status === 'devolvida' ? new Date(new Date(dataCriacao).getTime() + 86400000 * intBetween(1, 3, balance)).toISOString() : null,
      retirado_por: status === 'devolvida' ? 'Morador' : null,
      notificacao_enviada_whatsapp: chance(80, balance),
      notificacao_enviada_telegram: chance(30, balance),
      mensagem_aviso: null,
    });
  }
  return encomendas;
}

// ===================================================================
// S4: OCORRÊNCIAS
// ==================================================================/

export function generateOcorrencias(tenant: TenantConfig, moradores: Morador[], balance: () => number): Ocorrencia[] {
  const ocorrencias: Ocorrencia[] = [];
  const qtd = tenant.registros.ocorrencias;
  for (let i = 0; i < qtd; i++) {
    const categoria: 'barulho' | 'estacionamento' | 'mudanca' | 'animal' | 'patrimonio' | 'seguranca' | 'outros' = pick(['barulho', 'estacionamento', 'mudanca', 'animal', 'patrimonio', 'seguranca', 'outros'], balance);
    const gravidade: 'baixa' | 'media' | 'alta' | 'critica' = pick(['baixa', 'media', 'alta', 'critica'], balance);
    const status: 'aberta' | 'em_analise' | 'resolvida' = pick(['aberta', 'em_analise', 'resolvida'], balance);
    const bloco = tenant.blocos[Math.floor(balance() * tenant.blocos.length)];
    const apt = buildingUnit(balance);
    const dataHora = dateBetween(
      new Date('2024-01-01'),
      new Date('2026-12-31'),
      balance,
    );
    const descricao = pick(['Barulho excessivo', 'Vaga irregular', 'Animal solto', 'Patrimonio danificado', 'Problema de seguranca'], balance);
    const acao_tomada: 'nenhuma' | 'aviso' | 'multa' | 'remocao' = pick(['nenhuma', 'aviso', 'multa', 'remocao'], balance);
    ocorrencias.push({
      id: ocorrencias.length + 1,
      titulo: 'Ocorrencia ' + ocorrencias.length,
      categoria: categoria,
      gravidade: gravidade,
      status: status,
      bloco: bloco,
      apartamento: apt,
      morador_envolvido: moradores[Math.floor(balance() * moradores.length)]?.nome_completo || 'Desconhecido',
      descricao: descricao,
      acao_tomada: acao_tomada,
      registrado_por: 'Portaria',
      data_hora: dataHora,
      resolvido_em: status === 'resolvida' ? new Date(dataHora).toISOString() : null,
    });
  }
  return ocorrencias;
}
// ===================================================================
// S4: RESTRICÕES
// ==================================================================/

export function generateRestricoes(tenant: TenantConfig, balance: () => number): Restricao[] {
  const restricoes: Restricao[] = [];
  const qtd = tenant.registros.restricoes;
  for (let i = 0; i < qtd; i++) {
    const tipoIdentificador: 'cpf' | 'rg' | 'placa' | 'nome' = pick(['cpf', 'rg', 'placa', 'nome'], balance);
    const valores = ['123.456.789-00', 'ABC-1234', 'Joao Silva', 'Maria Costa'];
    const valorIdentificador = valores[Math.floor(balance() * valores.length)];
    const nomePessoa = ['Joao Silva', 'Maria Costa', 'Carlos Lima', 'Ana Pereira'][Math.floor(balance() * 4)];
    const motivo: 'animal' | 'barulho' | 'veiculo' | 'multa' | 'proibicao' | 'outros' = pick(['animal', 'barulho', 'veiculo', 'multa', 'proibicao', 'outros'], balance);
    const instrucao_portaria: 'proibido' | 'advertencia' | 'restricao_horario' = pick(['proibido', 'advertencia', 'restricao_horario'], balance);
    const bloqueio_total = chance(30, balance);
    const ativo = !bloqueio_total;
    const criado_por = 'Administracao';
    const criado_em = dateBetween(new Date('2024-01-01'), new Date('2026-12-31'), balance);

    restricoes.push({
      id: restricoes.length + 1,
      tipo_identificador: tipoIdentificador,
      valor_identificador: valorIdentificador,
      nome_pessoa: nomePessoa,
      motivo: motivo,
      instrucao_portaria: instrucao_portaria,
      bloqueio_total: bloqueio_total,
      ativo: ativo,
      criado_por: criado_por,
      criado_em: criado_em,
    });
  }
  return restricoes;
}

// ===================================================================
// S4: RESERVAS
// ==================================================================/

export function generateReservas(tenant: TenantConfig, moradores: Morador[], balance: () => number): Reserva[] {
  const reservas: Reserva[] = [];
  const qtd = tenant.registros.reservas;
  const espacos: string[] = ['salao_festas', 'churrasqueira_1', 'churrasqueira_2', 'quadra', 'coworking'];
  for (let i = 0; i < qtd; i++) {
    const morador = moradores[Math.floor(balance() * moradores.length)];
    const espaco: string = espacos[Math.floor(balance() * espacos.length)];
    const dataReserva = dateBetween(
      new Date('2024-01-01'),
      new Date('2026-12-31'),
      balance,
    );
    const periodo: 'dia_inteiro' | 'manha' | 'tarde' | 'noite' = pick(['dia_inteiro', 'manha', 'tarde', 'noite'], balance);
    const convidados_estimados = intBetween(0, 20, balance);
    const status: 'pendente' | 'confirmada' | 'cancelada' = pick(['pendente', 'confirmada', 'cancelada'], balance);

    reservas.push({
      id: reservas.length + 1,
      espaco: espaco as EspacoComum,
      espaco_nome: espaco.replace(/_/g, ' '),
      data_reserva: dataReserva,
      periodo: periodo,
      morador_id: morador.id,
      morador_nome: morador.nome_completo,
      bloco: morador.bloco,
      apartamento: morador.apartamento,
      status: status,
      convidados_estimados: convidados_estimados,
      observacoes: null,
      solicitado_em: dataReserva,
      aprovado_em: status === 'confirmada' ? new Date(dataReserva).toISOString() : null,
      aprovado_por: status === 'confirmada' ? 'Sindico' : null,
    });
  }
  return reservas;
}

// ===================================================================
// S4: COMUNICADOS
// ==================================================================/

export function generateComunicados(tenant: TenantConfig, balance: () => number): Comunicado[] {
  const comunicados: Comunicado[] = [];
  const qtd = tenant.registros.comunicados;
  const categorias: ('urgente' | 'manutencao' | 'assembleia' | 'aviso_geral' | 'evento')[] = ['urgente', 'manutencao', 'assembleia', 'aviso_geral', 'evento'];
  for (let i = 0; i < qtd; i++) {
    const categoria: ('urgente' | 'manutencao' | 'assembleia' | 'aviso_geral' | 'evento') = categorias[Math.floor(balance() * categorias.length)];
    const importante = chance(60, balance);
    const dataPublicacao = dateBetween(
      new Date('2024-01-01'),
      new Date('2026-12-31'),
      balance,
    );
    comunicados.push({
      id: comunicados.length + 1,
      titulo: 'Comunicado ' + (comunicados.length + 1),
      categoria: categoria,
      conteudo: pick(['Lembrete: reuniao de assembleia', 'Aviso: manutencao no elevador', 'Evento: churrasco de final de ano', 'Aviso: alteracao de horario de funcionamento', 'Urente: problema de seguranca no portao'], balance),
      importante: importante,
      publicado_por: 'Sindico',
      data_publicacao: dataPublicacao,
      ativo: true,
    });
  }
  return comunicados;
}
// ===================================================================
// S4: NOTIFICAÇÕES MORADOR
// ==================================================================/

export function generateNotificacoesMorador(tenant: TenantConfig, moradores: Morador[], balance: () => number): NotificacaoMorador[] {
  const notificacoes: NotificacaoMorador[] = [];
  const qtd = tenant.registros.notificacoes;
  const titulos: string[] = ['Lembrete: pagamento de condominio', 'Aviso: manutenção da rede de água', 'Alerta: visita de vistoria', 'Informativo: nova política de visitantes', 'Lembrete: data limite para reservas'];
  const canais: ('whatsapp' | 'telegram' | 'app' | 'email')[] = ['whatsapp', 'telegram', 'app', 'email'];
  for (let i = 0; i < qtd; i++) {
    const morador = moradores[Math.floor(balance() * moradores.length)];
    const lida = chance(40, balance);
    notificacoes.push({
      id: notificacoes.length + 1,
      morador_id: morador.id,
      tipo: pick(['encomenda', 'visitante', 'reserva', 'ocorrencia', 'comunicado', 'prestador'], balance),
      titulo: titulos[Math.floor(balance() * titulos.length)],
      mensagem: pick(['Seu pacote chegou na portaria.', 'A manutenção está prevista para amanhã.', 'A vistoria será na próxima semana.', 'As regras de visitantes foram atualizadas.', 'O prazo para reservas termina em 3 dias.'], balance),
      canal: canais[Math.floor(balance() * canais.length)],
      enviado_em: dateBetween(new Date('2024-01-01'), new Date('2026-12-31'), balance),
      lida: lida,
      dados_adicionais: lida ? null : { leitura_pendente: true },
    });
  }
  return notificacoes;
}

// ===================================================================
// S4: PRE-AUTORIZAÇÃO DE VISITANTE
// ==================================================================/

export function generatePreAutorizacaoVisitante(tenant: TenantConfig, moradores: Morador[], balance: () => number): PreAutorizacaoVisitante[] {
  const preautorizacoes: PreAutorizacaoVisitante[] = [];
  const qtd = tenant.registros.preautorizacoes;
  for (let i = 0; i < qtd; i++) {
    const morador = moradores[Math.floor(balance() * moradores.length)];
    const dataPrevista = dateBetween(
      new Date('2024-01-01'),
      new Date('2026-12-31'),
      balance,
    );
    const status: 'aguardando' | 'acessou' | 'cancelado' = pick(['aguardando', 'acessou', 'cancelado'], balance);
    const codigoAcessoQr = 'QR-' + intBetween(1000, 9999, balance);
    preautorizacoes.push({
      id: preautorizacoes.length + 1,
      morador_id: morador.id,
      morador_nome: morador.nome_completo,
      bloco: morador.bloco,
      apartamento: morador.apartamento,
      nome_visitante: 'Visitante ' + intBetween(1, 10, balance),
      documento_visitante: pick(['123.456.789-00', '999.999.999-99', null], balance),
      placa_veiculo: pick(['ABC-1234', 'DEF-5678', null], balance),
      data_prevista: dataPrevista,
      observacao: pick(['Visita de familiares', 'Entrega de encomenda', 'Serviço técnico', 'Consulta médica'], balance),
      codigo_acesso_qr: codigoAcessoQr,
      status: status,
      criado_em: dateBetween(new Date('2024-01-01'), new Date('2026-12-31'), balance),
    });
  }
  return preautorizacoes;
}

// S5: PRESTADORES
// ==================================================================/

export function generatePrestadores(tenant: TenantConfig, moradores: Morador[], balance: () => number): Prestador[] {
  const prestadores: Prestador[] = [];
  const qtd = 5; // Número fixo de prestadores para exemplo
  for (let i = 0; i < qtd; i++) {
    const morador = moradores[Math.floor(balance() * moradores.length)];
    const tipoVinculo: 'unidade' | 'condominio' = pick(['unidade', 'condominio'], balance);
    prestadores.push({
      id: prestadores.length + 1,
      nome: 'Prestador ' + (i + 1),
      documento: generateCpf(balance),
      tipo_documento: pick(['CPF', 'RG', 'CNH', 'Outro'], balance),
      empresa: 'Empresa ' + (i + 1),
      funcao: pick(['zedeiro', 'manutenção', 'segurança', 'portaria'], balance),
      telefone: generatePhone('am', balance),
      foto_url: null,
      placa_veiculo: generatePlate(balance),
      cracha_numero: 'CR-' + intBetween(100, 999, balance),
      tipo_vinculo: tipoVinculo,
      bloco: morador.bloco,
      apartamento: morador.apartamento,
      morador_autorizador_id: i === 0 ? morador.id : null,
      morador_autorizador_nome: i === 0 ? morador.nome_completo : null,
      data_inicio: dateBetween(new Date('2024-01-01'), new Date('2026-12-31'), balance),
      data_fim: i % 2 === 0 ? null : dateBetween(new Date('2024-01-01'), new Date('2026-12-31'), balance),
      horario_permitido: pick(['08:00-12:00', '13:00-17:00', '20:00-02:00'], balance),
      observacao: pick(['Serviço rotineiro', 'Manutenção preventiva', 'Emergência'], balance),
      presente: false,
      criado_em: dateBetween(new Date('2024-01-01'), new Date('2026-12-31'), balance),
      ativo: true,
    });
  }
  return prestadores;
}

// ===================================================================
// Main generator function
// ==================================================================/

export function generate(tenantConfigs: TenantConfig[] = TENANTS): Record<string, {
  moradores: Morador[];
  veiculos: Veiculo[];
  prestadores: Prestador[];
  visitantes: Visitante[];
  acessos: Acesso[];
  encomendas: Encomenda[];
  ocorrencias: Ocorrencia[];
  restricoes: Restricao[];
  reservas: Reserva[];
  comunicados: Comunicado[];
  notificacoes: NotificacaoMorador[];
  preautorizacoes: PreAutorizacaoVisitante[];
}> {
  const rngs: Record<string, () => number> = {};
  tenantConfigs.forEach(tenant => {
    rngs[tenant.slug] = makeRng(tenant.seed_prng);
  });

  return tenantConfigs.reduce((acc, tenant) => {
    const balance = rngs[tenant.slug];
    const moradores = generateMoradores(tenant, balance);
    const veiculos = generateVeiculos(tenant, moradores, balance);
    const prestadores = generatePrestadores(tenant, moradores, balance);
    const visitantes = generateVisitantes(tenant, moradores, balance);
    const acessos = generateAcessos(tenant, moradores, veiculos, balance);
    const encomendas = generateEncomendas(tenant, moradores, balance);
    const ocorrencias = generateOcorrencias(tenant, moradores, balance);
    const restricoes = generateRestricoes(tenant, balance);
    const reservas = generateReservas(tenant, moradores, balance);
    const comunicados = generateComunicados(tenant, balance);
    const notificacoes = generateNotificacoesMorador(tenant, moradores, balance);
    const preautorizacoes = generatePreAutorizacaoVisitante(tenant, moradores, balance);

    acc[tenant.slug] = {
      moradores,
      veiculos,
      prestadores,
      visitantes,
      acessos,
      encomendas,
      ocorrencias,
      restricoes,
      reservas,
      comunicados,
      notificacoes,
      preautorizacoes,
    };
    return acc;
  }, {} as Record<string, {
    moradores: Morador[];
    veiculos: Veiculo[];
    prestadores: Prestador[];
    visitantes: Visitante[];
    acessos: Acesso[];
    encomendas: Encomenda[];
    ocorrencias: Ocorrencia[];
    restricoes: Restricao[];
    reservas: Reserva[];
    comunicados: Comunicado[];
    notificacoes: NotificacaoMorador[];
    preautorizacoes: PreAutorizacaoVisitante[];
  }>);
}
