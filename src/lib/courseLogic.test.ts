import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canOpenStep,
  computeCourseState,
  formatClock,
  readingSeconds,
  remainingMs,
  type ProgressLike,
} from './courseLogic';

const IDS = ['m1', 'm2', 'm3'];
const row = (id: string, t: boolean, q: boolean, p: boolean): ProgressLike => ({
  module_id: id,
  theory_done_at: t ? '2026-01-01' : null,
  quiz_passed_at: q ? '2026-01-01' : null,
  practice_done_at: p ? '2026-01-01' : null,
});

test('sin progreso: el primer módulo es el actual y empieza por la teoría', () => {
  const s = computeCourseState(IDS, []);
  assert.equal(s.currentModuleId, 'm1');
  assert.deepEqual(s.modules[0].steps, { theory: 'current', quiz: 'locked', practice: 'locked' });
  assert.equal(s.modules[0].nextStep, 'theory');
  assert.equal(s.modules[1].status, 'locked');
  assert.equal(s.modules[2].status, 'locked');
  assert.equal(s.examUnlocked, false);
});

test('con la teoría hecha, el paso actual son las preguntas', () => {
  const s = computeCourseState(IDS, [row('m1', true, false, false)]);
  assert.deepEqual(s.modules[0].steps, { theory: 'done', quiz: 'current', practice: 'locked' });
  assert.equal(s.modules[0].nextStep, 'quiz');
});

test('un módulo completo desbloquea el siguiente, no los demás', () => {
  const s = computeCourseState(IDS, [row('m1', true, true, true)]);
  assert.equal(s.modules[0].status, 'done');
  assert.equal(s.modules[1].status, 'current');
  assert.equal(s.modules[2].status, 'locked');
  assert.equal(s.currentModuleId, 'm2');
  assert.equal(s.doneCount, 1);
});

test('progreso de un módulo posterior no salta el desbloqueo secuencial', () => {
  // Datos inconsistentes (p. ej. manipulados): m3 hecho pero m2 no.
  const s = computeCourseState(IDS, [row('m1', true, true, true), row('m3', true, true, true)]);
  assert.equal(s.modules[1].status, 'current');
  assert.equal(s.modules[2].status, 'done'); // se respeta lo registrado...
  assert.equal(s.examUnlocked, false); // ...pero el examen exige todos
});

test('todo completo habilita el examen', () => {
  const s = computeCourseState(IDS, IDS.map((id) => row(id, true, true, true)));
  assert.equal(s.examUnlocked, true);
  assert.equal(s.currentModuleId, null);
});

test('canOpenStep permite repasar pasos hechos y bloquea los futuros', () => {
  const s = computeCourseState(IDS, [row('m1', true, false, false)]);
  assert.equal(canOpenStep(s, 'm1', 'theory'), true);
  assert.equal(canOpenStep(s, 'm1', 'quiz'), true);
  assert.equal(canOpenStep(s, 'm1', 'practice'), false);
  assert.equal(canOpenStep(s, 'm2', 'theory'), false);
  assert.equal(canOpenStep(s, 'nope', 'theory'), false);
});

test('readingSeconds se mantiene entre 4 y 14 segundos', () => {
  assert.equal(readingSeconds('hola'), 4);
  assert.equal(readingSeconds(Array(40).fill('palabra').join(' ')), 10);
  assert.equal(readingSeconds(Array(400).fill('palabra').join(' ')), 14);
});

test('remainingMs corrige el desfase entre el reloj local y el del servidor', () => {
  // El reloj local va 60 s adelantado respecto al servidor.
  const serverNow = '2026-01-01T10:00:00.000Z';
  const deadline = '2026-01-01T10:30:00.000Z';
  const receivedAt = new Date('2026-01-01T10:01:00.000Z').getTime();
  const ms = remainingMs(deadline, serverNow, receivedAt, receivedAt + 10_000);
  assert.equal(ms, 30 * 60_000 - 10_000);
  assert.equal(remainingMs(deadline, serverNow, receivedAt, receivedAt + 40 * 60_000), 0);
});

test('formatClock muestra minutos y segundos', () => {
  assert.equal(formatClock(0), '0:00');
  assert.equal(formatClock(61_000), '1:01');
  assert.equal(formatClock(30 * 60_000), '30:00');
});
