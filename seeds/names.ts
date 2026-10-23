// seeds/names.ts
//
// Dados sintéticos por região (Manaus/AM e São Paulo/SP opcionais).
// Nenhum dado aqui identifica pessoa real.
//
// Regras:
// - CPF: sempre com digito verificador corretamente calculado via modulo 11.
// - Telefone: DDD sincronizado com a cidade de demo (Manaus = 92).
// - Placa: formato Mercosul LLL-NN (sem I, O, Q, Nenhum.).
// - Telegram: handle sincetico derivado do nome completo.

import { intBetween } from './rng';

const LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ';
const DIGITS = '0123456789';

export function generatePlate(rng: () => number): string {
  const parts = [
    pickChars(LETTERS, 3, rng),
    pickChars(DIGITS, 1, rng),
    pickChars(LETTERS, 1, rng),
    pickChars(DIGITS, 2, rng),
  ];
  return parts.join('-');
}

function pickChars(chars: string, count: number, rng: () => number): string {
  let out = '';
  for (let i = 0; i < count; i++) {
    out += chars[Math.floor(rng() * chars.length)];
  }
  return out;
}

export function generatePhone(region: 'am' | 'sp', rng: () => number): string {
  const ddd = region === 'am' ? '92' : '11';
  const part1 = intBetween(10000000, 99999999, rng).toString();
  const part2 = intBetween(1000, 9999, rng).toString();
  return '(' + ddd + ') ' + part1 + '-' + part2;
}

export function generateCpf(rng: () => number): string {
  const digits = Array.from({ length: 9 }, () => intBetween(0, 9, rng));
  const d1 = computeDigit(digits, 10);
  const d2 = computeDigit(digits.concat([d1]), 11);
  return digits.join('') + '.' + d1 + d2 + '-' + d1 + d2;
}

function computeDigit(numbers: number[], start: number): number {
  let sum = 0;
  for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i] * (start - i);
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function generateTelegram(first: string, last: string, rng: () => number): string {
  const base = first.toLowerCase() + last.toLowerCase();
  const num = intBetween(10, 99, rng).toString();
  return '@' + base + num;
}

export const FIRST_NAMES = [
  'Antonio', 'Carlos', 'Joao', 'Maria', 'Jose', 'Pedro', 'Ana', 'Lucia', 'Francisco', 'Isabel',
  'Rafael', 'Valentina', 'Gabriel', 'Beatriz', 'Miguel', 'Helena', 'Lucas', 'Paula', 'Fernando', 'Sofia',
  'Julio', 'Cecilia', 'Andre', 'Ndunda', 'Emanuelle', 'Henrique', 'Camila', 'Rafaela', 'Guilherme', 'Mariana',
  'Gilberto', 'Nivalda', 'Marta', 'Raimundo', 'Severino', 'Anibal', 'Odete', 'Benigno', 'Jacinta', 'Vicente',
  'Celso', 'Ivone', 'Lourdes', 'Glicerio', 'Arnaldo', 'Malvina', 'Amadeu', 'Serafina', 'Eliseu', 'Previdente',
  'Cristovao', 'Severo', 'Eurico', 'Arlindo', 'Elciodo', 'Horacio', 'Benedito', 'Nikolas', 'Natalia', 'Bianca',
  'Christopher', 'Bruno', 'Daniel', 'Eduardo', 'Eduarda', 'Erick', 'Estevao', 'Felipe', 'Flavia',
  'Francisco', 'Gabriel', 'Gisele', 'Guilherme', 'Isac', 'Isabel', 'Jaqueline', 'Joao', 'Josiane', 'Juliana',
  'Leonardo', 'Lia', 'Lorenzo', 'Lucia', 'Luciano', 'Luzia', 'Manoel', 'Maria', 'Marcelo', 'Marcella',
  'Mauro', 'Melissa', 'Nicolas', 'Nina', 'Nuno', 'Olivia', 'Otario', 'Patricia', 'Paulo', 'Paula',
  'Rafael', 'Renato', 'Ricardo', 'Roberto', 'Sandra', 'Sergio', 'Silvia', 'Stefano', 'Tatiana',
  'Urbano', 'Valeria', 'Vania', 'Vitor', 'Vitoria', 'Waldir', 'Washington', 'Wilson', 'Yara', 'Yuri',
];

export const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Reis', 'Passos', 'Cruz',
  'Lima', 'Almeida', 'Barbosa', 'Aragao', 'Melo', 'Pereira', 'Martins', 'Aguiar', 'Medeiros', 'Rocha',
  'Carvalho', 'Nobre', 'Torres', 'Neto', 'Mota', 'Ferreira', 'Gomes', 'Cardoso', 'Sanches', 'Goncalves',
  'Batista', 'Brandao', 'Cascavel', 'Cavali', 'Diniz', 'Duarte', 'Farias', 'Figueiredo', 'Fonseca', 'Fraga',
  'Guerra', 'Jaramillo', 'Jeronimo', 'Leao', 'Leite', 'Lira', 'Lopes', 'Luz', 'Macedo', 'Machado',
  'Malta', 'Marinho', 'Marques', 'Matos', 'Mello', 'Mendes', 'Moreira', 'Motta', 'Munhoz', 'Nunes',
  'Pascoal', 'Pereira', 'Pimenta', 'Pinheiro', 'Pires', 'Pizzi', 'Queiroz', 'Ramalho', 'Rangel', 'Rezende',
  'Ribeiro', 'Rosa', 'Sabbagh', 'Salgado', 'Sales', 'Santana', 'Sarra', 'Sattelo', 'Souza',
  'Stella', 'Tavares', 'Teixeira', 'Torres', 'Underwood', 'Vale', 'Vaz', 'Venancio', 'Viana', 'Xavier',
  'Zanatta', 'Zorba', 'Andrade', 'Baptista', 'Blanco', 'Candido', 'Dourado', 'Espindola', 'Fonseca', 'Gomes',
];
