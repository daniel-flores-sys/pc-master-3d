// Verificación de seguridad y reglas del backend (InsForge).
// Crea dos estudiantes de prueba (qa-*@example.com), recorre el flujo e intenta
// saltarse las reglas. Requiere: .env.local, .insforge/ y content-private/.
//
//   node scripts/verify-backend.mjs
//
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createClient } from '@insforge/sdk';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  readFileSync(path.join(root, '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const baseUrl = env.VITE_INSFORGE_URL;
const anonKey = env.VITE_INSFORGE_ANON_KEY;

let failures = 0;
const ok = (cond, label, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  → ${extra}` : ''}`);
  if (!cond) failures++;
};

function adminSql(sql) {
  // Solo para preparar escenarios (como administrador, vía CLI).
  const out = execSync(`npx -y @insforge/cli db query "${sql.replace(/"/g, '\\"')}" --json`, {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).toString();
  return JSON.parse(out.slice(out.indexOf('{'))).rows ?? [];
}

async function newStudent(tag) {
  const client = createClient({ baseUrl, anonKey });
  const email = `qa-${tag}-${Date.now()}@example.com`;
  const { data, error } = await client.auth.signUp({ email, password: 'prueba-123456', name: `QA ${tag}` });
  if (error) throw new Error(`signUp ${tag}: ${error.message}`);
  return { client, id: data.user.id, email };
}

const { quiz } = await import(pathToFileURL(path.join(root, 'content-private', 'question-bank.mjs')).href);
// Índices correctos tal como quedaron en la base (barajados): se leen como admin.
const keyRows = adminSql("select question_id, correct_index from public.answer_keys where question_id like 'm1q%' order by question_id");
const correct = Object.fromEntries(keyRows.map((r) => [r.question_id, Number(r.correct_index)]));
ok(Object.keys(correct).length === quiz.edu_basics.length, 'claves del módulo 1 leídas como admin', JSON.stringify(correct));

// ---------------------------------------------------------------- anónimo
const anon = createClient({ baseUrl, anonKey });
{
  const r = await anon.database.from('answer_keys').select('*').limit(5);
  ok(!!r.error || (r.data ?? []).length === 0, 'anónimo NO lee answer_keys', r.error?.message ?? `${r.data?.length} filas`);
  const q = await anon.database.from('questions').select('id').limit(5);
  ok(!!q.error || (q.data ?? []).length === 0, 'anónimo NO lee preguntas', q.error?.message ?? `${q.data?.length} filas`);
  const e = await anon.database.rpc('start_exam', {});
  ok(!!e.error, 'anónimo NO puede iniciar examen', e.error?.message);
}

// ---------------------------------------------------------------- estudiante A
const A = await newStudent('a');
const B = await newStudent('b');
{
  const k = await A.client.database.from('answer_keys').select('*').limit(5);
  ok(!!k.error || (k.data ?? []).length === 0, 'estudiante NO lee answer_keys', k.error?.message ?? `${k.data?.length} filas`);

  const ex = await A.client.database.from('questions').select('id').eq('bank', 'exam').limit(5);
  ok((ex.data ?? []).length === 0, 'estudiante NO lee el banco del examen', `${ex.data?.length ?? 0} filas`);

  const qq = await A.client.database.from('questions').select('id, options').eq('module_id', 'edu_basics');
  ok((qq.data ?? []).length === 4, 'estudiante lee las 4 preguntas del módulo 1');
  ok(!JSON.stringify(qq.data).includes('correct'), 'las preguntas no traen la respuesta');

  const helper = await A.client.database.rpc('_grade_exam', { p_attempt: '00000000-0000-0000-0000-000000000000', p_status: 'submitted' });
  ok(!!helper.error, 'funciones internas "_" no son invocables', helper.error?.message);

  const locked = await A.client.database.rpc('complete_theory', { p_module: 'edu_identification' });
  ok(!!locked.error, 'no puede saltar al módulo 2', locked.error?.message);

  const early = await A.client.database.rpc('answer_quiz_question', { p_question: 'm1q1', p_selected: 0 });
  ok(!!early.error, 'no responde preguntas sin teoría', early.error?.message);

  const prac = await A.client.database.rpc('complete_practice', { p_module: 'edu_basics' });
  ok(!!prac.error, 'no completa práctica sin aprobar preguntas', prac.error?.message);

  const th = await A.client.database.rpc('complete_theory', { p_module: 'edu_basics' });
  ok(!th.error, 'completa la teoría del módulo 1', th.error?.message);

  // Primer intento: todas mal → no aprueba
  let last;
  for (const id of Object.keys(correct)) {
    last = await A.client.database.rpc('answer_quiz_question', { p_question: id, p_selected: (correct[id] + 1) % 4 });
  }
  ok(last.data?.finished && last.data?.passed === false, 'intento con respuestas incorrectas no aprueba', JSON.stringify({ score: last.data?.score, passed: last.data?.passed }));

  // Cambiar una respuesta ya dada dentro del mismo intento no debe servir
  await A.client.database.rpc('restart_quiz', { p_module: 'edu_basics' });
  const first = await A.client.database.rpc('answer_quiz_question', { p_question: 'm1q1', p_selected: (correct.m1q1 + 1) % 4 });
  const again = await A.client.database.rpc('answer_quiz_question', { p_question: 'm1q1', p_selected: correct.m1q1 });
  ok(first.data?.is_correct === false && again.data?.selected === first.data?.selected, 'la primera respuesta queda fija', `selected=${again.data?.selected}`);
  await A.client.database.rpc('restart_quiz', { p_module: 'edu_basics' });

  for (const id of Object.keys(correct)) {
    last = await A.client.database.rpc('answer_quiz_question', { p_question: id, p_selected: correct[id] });
  }
  ok(last.data?.passed === true && last.data?.score === 4, 'intento correcto aprueba 4/4');

  const prac2 = await A.client.database.rpc('complete_practice', { p_module: 'edu_basics' });
  ok(!prac2.error, 'completa la práctica del módulo 1', prac2.error?.message);

  const st = await A.client.database.rpc('exam_status', {});
  ok(st.data?.eligible === false && st.data?.modules_done === 1, 'examen todavía no habilitado (1/7)');
  const se = await A.client.database.rpc('start_exam', {});
  ok(!!se.error, 'no puede iniciar el examen sin los 7 módulos', se.error?.message);

  const own = await A.client.database.from('module_progress').select('module_id');
  ok((own.data ?? []).length === 1, 'A ve su propio progreso');
  const ins = await A.client.database.from('module_progress').insert([{ user_id: A.id, module_id: 'edu_installation', practice_done_at: new Date().toISOString() }]);
  ok(!!ins.error, 'A no puede escribir su progreso directamente', ins.error?.message);
}

// ---------------------------------------------------------------- estudiante B
{
  const other = await B.client.database.from('module_progress').select('module_id, user_id');
  ok((other.data ?? []).length === 0, 'B no ve el progreso de A');
  const attemptsB = await B.client.database.from('quiz_attempts').select('id');
  ok((attemptsB.data ?? []).length === 0, 'B no ve los intentos de A');
}

// ---------------------------------------------------------------- examen
{
  adminSql(
    `insert into public.module_progress (user_id, module_id, theory_done_at, quiz_passed_at, practice_done_at) select '${A.id}', id, now(), now(), now() from public.course_modules on conflict (user_id, module_id) do update set practice_done_at = now(), quiz_passed_at = now(), theory_done_at = now()`,
  );
  const st = await A.client.database.rpc('exam_status', {});
  ok(st.data?.eligible === true, 'con 7 módulos el examen se habilita');

  const start = await A.client.database.rpc('start_exam', {});
  ok(!start.error && start.data?.questions?.length === 20, 'inicia examen con 20 preguntas', start.error?.message);
  ok(!JSON.stringify(start.data).includes('correct_index'), 'las preguntas del examen no traen la respuesta');
  const attempt = start.data.attempt_id;

  const again = await A.client.database.rpc('start_exam', {});
  ok(again.data?.attempt_id === attempt, 'volver a iniciar retoma el mismo intento');

  const foreign = await B.client.database.rpc('save_exam_answers', { p_attempt: attempt, p_answers: { x: 1 } });
  ok(!!foreign.error, 'B no puede escribir en el examen de A', foreign.error?.message);

  const q0 = start.data.questions[0].id;
  const sv = await A.client.database.rpc('save_exam_answers', { p_attempt: attempt, p_answers: { [q0]: 0, 'no-existe': 2 } });
  ok(!sv.error, 'guarda respuestas parciales', sv.error?.message);

  let v;
  for (const t of ['fullscreen_exit', 'tab_hidden', 'window_blur']) {
    v = await A.client.database.rpc('log_exam_event', { p_attempt: attempt, p_type: t });
  }
  ok(v.data === 3, 'cuenta 3 advertencias', `violations=${v.data}`);
  const bad = await A.client.database.rpc('log_exam_event', { p_attempt: attempt, p_type: 'hack' });
  ok(!!bad.error, 'rechaza tipos de evento inventados');

  // Plazo vencido: las respuestas enviadas tarde se ignoran
  adminSql(`update public.exam_attempts set deadline = now() - interval '10 minutes' where id = '${attempt}'`);
  const allRight = Object.fromEntries(start.data.questions.map((q) => [q.id, 0]));
  const late = await A.client.database.rpc('submit_exam', { p_attempt: attempt, p_answers: allRight });
  ok(!late.error && late.data?.status === 'expired', 'entrega fuera de plazo queda como vencida', late.error?.message ?? late.data?.status);
  ok(late.data?.review === null, 'sin revisión detallada mientras queden intentos');

  const twice = await A.client.database.rpc('submit_exam', { p_attempt: attempt, p_answers: allRight });
  ok(!!twice.error, 'no se puede entregar dos veces');

  const st2 = await A.client.database.rpc('exam_status', {});
  ok(st2.data?.attempts_used === 1, 'consumió 1 de 2 intentos');
}

console.log(`\n${failures === 0 ? 'Todo correcto' : `${failures} verificaciones fallaron`}.`);
console.log(`Usuarios de prueba creados: ${A.email}, ${B.email}`);
process.exit(failures === 0 ? 0 : 1);
