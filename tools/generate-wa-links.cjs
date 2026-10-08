#!/usr/bin/env node
/*
 * WhatsApp Link Generator — AMBROS Prospecting Tool
 *
 * Reads a CSV of condominium contacts (from Google Maps prospecting) and
 * generates personalized wa.me links for first-contact outreach.
 *
 * Usage:
 *   node tools/generate-wa-links.js docs/marketing/condominios-prospecting.csv
 *   node tools/generate-wa-links.js docs/marketing/condominios-prospecting.csv --followup
 *
 * Output: links.txt printed to stdout + links.csv saved in same dir.
 */
const fs = require("fs");
const path = require("path");

const MSG_DIA_0 = "Olá {{nome}}, tudo bem?%0A%0ARepresento o AMBROS, sistema de gestão de condomínio que já ajuda mais de 20 síndicos no SP a reduzir filas na portaria em até 70%.%0A%0AVi que o {{condominio}} poderia se beneficiar de controle digital de visitantes e encomendas. Posso te mostrar em 15 minutos como resolver isso?%0A%0ATem disponibilidade para uma demo rápida hoje à tarde?%0A%0AAbraço!";
const MSG_DIA_2 = "Oi {{nome}}, só reforçando a mensagem sobre o AMBROS. Outros condomínios na região já reduziram a burocracia da portaria em 70%. Ainda tenho disponibilidade hoje para uma call de 15 minutos. Se interessar, me avisa!%0A[]";
const MSG_DIA_5 = "{{nome}}, última tentativa desta semana. Oferecemos acesso antecipado com 20% de desconto. Se ainda houver interesse em testar grátis por 14 dias, estou à disposição.%0A[]";

const SEU_NOME = process.env.AMBROS_NOME || "Carlos";

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n").filter(l => l.trim());
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
    return obj;
  });
}

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  let normalized = digits;
  if (normalized.length === 11 && normalized.startsWith("0")) {
    normalized = normalized.substring(1);
  }
  if (!normalized.startsWith("55") && normalized.length === 11) {
    normalized = "55" + normalized;
  } else if (normalized.length === 10) {
    normalized = "55" + normalized;
  }
  return normalized;
}

function personalize(template, lead) {
  return template
    .replace(/\{\{nome\}\}/g, lead.sindico_nome || "Síndico")
    .replace(/\{\{seu_nome\}\}/g, SEU_NOME)
    .replace(/\{\{condominio\}\}/g, lead.nome_condominio || "seu condomínio");
}

const args = process.argv.slice(2);
const csvPath = args.find(a => !a.startsWith("--"));
const followup = args.includes("--followup");
const isFollowup2 = args.includes("--followup2");

if (!csvPath) {
  console.error("Uso: node generate-wa-links.js <arquivo.csv> [--followup]");
  process.exit(1);
}

const template = isFollowup2 ? MSG_DIA_5 : followup ? MSG_DIA_2 : MSG_DIA_0;
const stepLabel = isFollowup2 ? "Dia 5" : followup ? "Dia 2" : "Dia 0";

const leads = parseCSV(csvPath);
const whatsappLeads = leads.filter(l => l.eh_whatsapp === "sim" && l.telefone);

console.log(`\n=== Gerador de Links WhatsApp — AMBROS (${stepLabel}) ===\n`);
console.log(`Total de leads no CSV: ${leads.length}`);
console.log(`Leads com WhatsApp verificado: ${whatsappLeads.length}\n`);

let links = [];
whatsappLeads.forEach(lead => {
  const phone = normalizePhone(lead.telefone);
  if (!phone) return;
  const msg = personalize(template, lead);
  const url = `https://wa.me/${phone}?text=${msg}`;
  links.push({
    lead_id: lead.lead_id,
    nome_condominio: lead.nome_condominio,
    bairro: lead.bairro,
    cidade: lead.cidade,
    sindico_nome: lead.sindico_nome || "(não informado)",
    telefone: lead.telefone,
    url
  });
});

console.log("Links gerados (abrir um por vez, nunca usar lista de transmissão):\n");
links.forEach(l => {
  console.log(`[${l.lead_id}] ${l.nome_condominio} — ${l.sindico_nome}`);
  console.log(`  📱 ${l.telefone}`);
  console.log(`  🔗 ${l.url}\n`);
});

const csv = links.map(l =>
  `"${l.lead_id}","${l.nome_condominio}","${l.bairro}","${l.cidade}","${l.sindico_nome}","${l.telefone}","${l.url}"`
).join("\n");

const outputPath = path.join(path.dirname(csvPath), "links-whatsapp-" + stepLabel.replace(" ", "").toLowerCase() + ".csv");
fs.writeFileSync(outputPath, "lead_id,nome_condominio,bairro,cidade,sindico_nome,telefone,url\n" + csv);
console.log(`Arquivo salvo: ${outputPath}`);
console.log(`\nTotal de links gerados: ${links.length}`);
console.log("\n⚠️  Lembre-se: envie mensagens individualmente (não use lista de transmissão).");
console.log("   Comece com 5-10 por dia e aumente gradualmente para evitar bloqueio do WhatsApp.\n");
