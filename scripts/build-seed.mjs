// Genera content-private/seed.sql a partir de content-private/question-bank.mjs.
// Uso:  node scripts/build-seed.mjs && npx -y @insforge/cli db import content-private/seed.sql
//
// Baraja las opciones de forma determinista (id + sal secreta privada) para que la
// respuesta correcta no esté siempre en la misma posición ni se pueda deducir del id.
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bankPath = path.join(root, 'content-private', 'question-bank.mjs');
const { quiz, exam, shuffleSalt } = await import(pathToFileURL(bankPath).href);
if (!shuffleSalt || shuffleSalt.length < 16) {
  // Sin una sal secreta, el orden de las opciones sería deducible desde el id (público).
  throw new Error('Falta shuffleSalt (>= 16 caracteres) en content-private/question-bank.mjs');
}

function hash(str) {
  let h = 2166136261;
  for (const ch of str) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle(options, seed) {
  const order = options.map((_, i) => i);
  let s = seed || 1;
  for (let i = order.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    const j = s % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    options: order.map((i) => options[i]),
    correctIndex: order.indexOf(0),
  };
}

const sql = (v) => (v === null ? 'NULL' : `'${String(v).replaceAll("'", "''")}'`);

const rows = [];
for (const [moduleId, questions] of Object.entries(quiz)) {
  questions.forEach((q, i) => rows.push({ bank: 'quiz', moduleId, position: i + 1, q }));
}
exam.forEach((q, i) => rows.push({ bank: 'exam', moduleId: null, position: i + 1, q }));

const ids = new Set();
const lines = [];
const distribution = [0, 0, 0, 0];

for (const { bank, moduleId, position, q } of rows) {
  const [id, topic, prompt, options, explanation] = q;
  if (ids.has(id)) throw new Error(`Id duplicado: ${id}`);
  ids.add(id);
  if (options.length < 2) throw new Error(`Pocas opciones en ${id}`);
  const { options: shuffled, correctIndex } = shuffle(options, hash(`${shuffleSalt}:${id}`));
  distribution[correctIndex]++;
  lines.push(
    `INSERT INTO public.questions (id, bank, module_id, position, topic, prompt, options) VALUES (` +
      `${sql(id)}, ${sql(bank)}, ${sql(moduleId)}, ${position}, ${sql(topic)}, ${sql(prompt)}, ` +
      `${sql(JSON.stringify(shuffled))}::jsonb) ON CONFLICT (id) DO UPDATE SET ` +
      `bank = EXCLUDED.bank, module_id = EXCLUDED.module_id, position = EXCLUDED.position, ` +
      `topic = EXCLUDED.topic, prompt = EXCLUDED.prompt, options = EXCLUDED.options;`,
    `INSERT INTO public.answer_keys (question_id, correct_index, explanation) VALUES (` +
      `${sql(id)}, ${correctIndex}, ${sql(explanation)}) ON CONFLICT (question_id) DO UPDATE SET ` +
      `correct_index = EXCLUDED.correct_index, explanation = EXCLUDED.explanation;`,
  );
}

const out = path.join(root, 'content-private', 'seed.sql');
writeFileSync(out, lines.join('\n') + '\n', 'utf8');
console.log(`OK: ${rows.length} preguntas → ${path.relative(root, out)}`);
console.log(`Posición de la respuesta correcta (A/B/C/D): ${distribution.join(' / ')}`);
