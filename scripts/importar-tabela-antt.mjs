// Uso: node scripts/importar-tabela-antt.mjs arquivo.html destino.json
// O HTML deve ser o texto da Portaria 22/2026 no ANTTlegis (fonte abaixo).
import fs from 'node:fs';
import crypto from 'node:crypto';
const [entrada, destino] = process.argv.slice(2);
if (!entrada || !destino || fs.existsSync(destino)) throw Error('Informe HTML e um destino novo; tabelas existentes não são sobrescritas.');
const bytes = fs.readFileSync(entrada);
const html = new TextDecoder('windows-1252').decode(bytes);
if (!html.includes('00000022') || !html.includes('2026')) throw Error('Documento inesperado.');
const tables = [...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)];
const tabelas = {};
for (const [index, letra] of ['A', 'B', 'C', 'D'].entries()) {
  const rows = [...tables[index * 2 + 1][1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map(row => [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map(cell => cell[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim())).filter(row => row.length);
  if (rows.length !== 24) throw Error('Estrutura das tabelas mudou. Revise o importador.');
  tabelas[letra] = Array.from({ length: 12 }, (_, i) => {
    const valores = row => row.slice(-7).map(v => {
      if (!v) return null;
      if (!/^\d[\d.]*,\d+$/.test(v)) throw Error('Coeficiente inesperado.');
      return Number(v.replaceAll('.', '').replace(',', '.'));
    });
    return { tipoCarga: i + 1, ccd: valores(rows[i * 2]), cc: valores(rows[i * 2 + 1]) };
  });
}
const dados = { norma: 'Portaria SUROC 22/2026', vigencia: '2026-09-30',
  fonte: 'https://anttlegis.datalegis.inf.br/action/ActionDatalegis.php?acao=abrirTextoAto&cod_menu=7817&cod_modulo=161&link=S&numeroAto=00000022&orgao=SUROC%2FANTT%2FMT&seqAto=000&tipo=POR&valorAno=2026',
  hashFonteSha256: crypto.createHash('sha256').update(bytes).digest('hex'), eixos: [2, 3, 4, 5, 6, 7, 9], tabelas };
fs.mkdirSync(new URL('../Transportador.Api/Fretes/Dados/', import.meta.url), { recursive: true });
fs.writeFileSync(destino, JSON.stringify(dados, null, 2) + '\n');
console.log('Importadas quatro tabelas, com 12 tipos de carga cada.');
