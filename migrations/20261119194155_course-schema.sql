-- =====================================================================
-- PC MASTER 3D — esquema del curso
-- Progreso por módulo (teoría → preguntas → práctica) y examen final.
-- Las respuestas correctas viven en public.answer_keys, que NO es
-- accesible para anon/authenticated. Solo las leen funciones
-- SECURITY DEFINER que califican en el servidor.
-- =====================================================================

-- ---------- Módulos del curso (orden del roadmap) ----------
CREATE TABLE public.course_modules (
  id        text PRIMARY KEY,
  position  int  NOT NULL UNIQUE CHECK (position > 0),
  title     text NOT NULL
);

INSERT INTO public.course_modules (id, position, title) VALUES
  ('edu_basics',         1, 'Conceptos básicos de hardware'),
  ('edu_identification', 2, 'Identificación de componentes'),
  ('edu_preventive',     3, 'Mantenimiento preventivo'),
  ('edu_corrective',     4, 'Mantenimiento correctivo'),
  ('edu_diagnosis',      5, 'Diagnóstico de fallas'),
  ('edu_disassembly',    6, 'Desmontaje seguro'),
  ('edu_installation',   7, 'Instalación y pruebas finales');

-- ---------- Banco de preguntas (sin respuestas) ----------
CREATE TABLE public.questions (
  id         text PRIMARY KEY,
  bank       text NOT NULL CHECK (bank IN ('quiz', 'exam')),
  module_id  text REFERENCES public.course_modules(id) ON DELETE CASCADE,
  position   int  NOT NULL DEFAULT 0,
  topic      text NOT NULL,
  prompt     text NOT NULL,
  options    jsonb NOT NULL CHECK (jsonb_typeof(options) = 'array'),
  CHECK (bank = 'exam' OR module_id IS NOT NULL)
);
CREATE INDEX questions_bank_module_idx ON public.questions (bank, module_id, position);

-- ---------- Clave de respuestas (privada) ----------
CREATE TABLE public.answer_keys (
  question_id    text PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
  correct_index  int  NOT NULL CHECK (correct_index >= 0),
  explanation    text NOT NULL
);

-- ---------- Progreso por módulo ----------
CREATE TABLE public.module_progress (
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id         text NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  theory_done_at    timestamptz,
  quiz_best_score   int,
  quiz_total        int,
  quiz_passed_at    timestamptz,
  practice_done_at  timestamptz,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, module_id)
);

-- ---------- Intentos de preguntas de módulo ----------
CREATE TABLE public.quiz_attempts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id    text NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  answers      jsonb NOT NULL DEFAULT '{}'::jsonb,
  score        int,
  total        int,
  passed       boolean,
  started_at   timestamptz NOT NULL DEFAULT now(),
  finished_at  timestamptz
);
CREATE UNIQUE INDEX quiz_attempts_one_open_idx
  ON public.quiz_attempts (user_id, module_id) WHERE finished_at IS NULL;
CREATE INDEX quiz_attempts_user_idx ON public.quiz_attempts (user_id, module_id);

-- ---------- Examen final ----------
CREATE TABLE public.exam_attempts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at    timestamptz NOT NULL DEFAULT now(),
  deadline      timestamptz NOT NULL,
  submitted_at  timestamptz,
  question_ids  text[] NOT NULL,
  answers       jsonb NOT NULL DEFAULT '{}'::jsonb,
  score         int,
  total         int,
  passed        boolean,
  violations    int NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'in_progress'
                CHECK (status IN ('in_progress', 'submitted', 'expired'))
);
CREATE UNIQUE INDEX exam_attempts_one_open_idx
  ON public.exam_attempts (user_id) WHERE status = 'in_progress';
CREATE INDEX exam_attempts_user_idx ON public.exam_attempts (user_id);

CREATE TABLE public.exam_events (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attempt_id  uuid NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX exam_events_attempt_idx ON public.exam_events (attempt_id);

-- =====================================================================
-- Privilegios + RLS
-- Los estudiantes solo LEEN sus filas. Toda escritura pasa por RPC.
-- =====================================================================
ALTER TABLE public.course_modules  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_keys     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_events     ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.course_modules, public.questions, public.answer_keys,
              public.module_progress, public.quiz_attempts,
              public.exam_attempts, public.exam_events
  FROM anon, authenticated;

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.course_modules TO anon, authenticated;
CREATE POLICY "modules are public" ON public.course_modules
  FOR SELECT TO anon, authenticated USING (true);

-- Solo preguntas de módulo. Las del examen se entregan por RPC al iniciarlo.
GRANT SELECT ON public.questions TO authenticated;
CREATE POLICY "students read quiz questions" ON public.questions
  FOR SELECT TO authenticated USING (bank = 'quiz');

-- answer_keys: sin GRANT y sin políticas → inaccesible para la app.

GRANT SELECT ON public.module_progress TO authenticated;
CREATE POLICY "own progress" ON public.module_progress
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

GRANT SELECT (id, module_id, score, total, passed, started_at, finished_at)
  ON public.quiz_attempts TO authenticated;
CREATE POLICY "own quiz attempts" ON public.quiz_attempts
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

GRANT SELECT (id, started_at, deadline, submitted_at, score, total, passed, violations, status)
  ON public.exam_attempts TO authenticated;
CREATE POLICY "own exam attempts" ON public.exam_attempts
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- exam_events: solo se escriben por RPC; no se exponen al estudiante.

-- =====================================================================
-- Parámetros del curso
-- =====================================================================
CREATE OR REPLACE FUNCTION public._course_setting(p_key text)
RETURNS int
LANGUAGE sql IMMUTABLE
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT CASE p_key
    WHEN 'quiz_pass_pct'      THEN 70
    WHEN 'exam_pass_pct'      THEN 70
    WHEN 'exam_questions'     THEN 20
    WHEN 'exam_minutes'       THEN 30
    WHEN 'exam_max_attempts'  THEN 2
    WHEN 'exam_max_violations' THEN 3
    WHEN 'exam_grace_seconds' THEN 30
  END;
$$;

CREATE OR REPLACE FUNCTION public._require_uid()
RETURNS uuid
LANGUAGE plpgsql STABLE
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Necesitas iniciar sesión.' USING ERRCODE = '28000';
  END IF;
  RETURN v_uid;
END;
$$;

-- ¿Puede este usuario trabajar en este módulo? (primero, o el anterior completo)
CREATE OR REPLACE FUNCTION public._module_unlocked(p_uid uuid, p_module text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT CASE
    WHEN m.position = 1 THEN true
    ELSE EXISTS (
      SELECT 1
      FROM public.course_modules prev
      JOIN public.module_progress mp
        ON mp.module_id = prev.id AND mp.user_id = p_uid
      WHERE prev.position = m.position - 1
        AND mp.practice_done_at IS NOT NULL
    )
  END
  FROM public.course_modules m
  WHERE m.id = p_module;
$$;

CREATE OR REPLACE FUNCTION public._assert_module_unlocked(p_uid uuid, p_module text)
RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_ok boolean := public._module_unlocked(p_uid, p_module);
BEGIN
  IF v_ok IS NULL THEN
    RAISE EXCEPTION 'Módulo desconocido: %', p_module USING ERRCODE = '22023';
  ELSIF NOT v_ok THEN
    RAISE EXCEPTION 'Este módulo todavía está bloqueado. Completa el anterior.' USING ERRCODE = '42501';
  END IF;
END;
$$;

-- =====================================================================
-- Paso 1: teoría
-- =====================================================================
CREATE OR REPLACE FUNCTION public.complete_theory(p_module text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid uuid := public._require_uid();
BEGIN
  PERFORM public._assert_module_unlocked(v_uid, p_module);

  INSERT INTO public.module_progress (user_id, module_id, theory_done_at)
  VALUES (v_uid, p_module, now())
  ON CONFLICT (user_id, module_id) DO UPDATE
    SET theory_done_at = COALESCE(public.module_progress.theory_done_at, now()),
        updated_at = now();
END;
$$;

-- =====================================================================
-- Paso 2: preguntas del módulo (una a la vez, calificadas en servidor)
-- Cada respuesta queda fija dentro del intento; al responder todas, se
-- cierra el intento. Para reintentar se abre un intento nuevo.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.answer_quiz_question(p_question text, p_selected int)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid      uuid := public._require_uid();
  v_module   text;
  v_attempt  public.quiz_attempts;
  v_key      public.answer_keys;
  v_selected int;
  v_total    int;
  v_answered int;
  v_score    int;
  v_passed   boolean;
BEGIN
  SELECT q.module_id INTO v_module
  FROM public.questions q
  WHERE q.id = p_question AND q.bank = 'quiz';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pregunta desconocida.' USING ERRCODE = '22023';
  END IF;

  PERFORM public._assert_module_unlocked(v_uid, v_module);

  IF NOT EXISTS (
    SELECT 1 FROM public.module_progress
    WHERE user_id = v_uid AND module_id = v_module AND theory_done_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Primero completa la teoría de este módulo.' USING ERRCODE = '42501';
  END IF;

  -- Intento abierto (o uno nuevo)
  SELECT * INTO v_attempt
  FROM public.quiz_attempts
  WHERE user_id = v_uid AND module_id = v_module AND finished_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.quiz_attempts (user_id, module_id)
    VALUES (v_uid, v_module)
    RETURNING * INTO v_attempt;
  END IF;

  SELECT * INTO v_key FROM public.answer_keys WHERE question_id = p_question;

  -- Si ya respondió esta pregunta en este intento, se respeta la primera respuesta.
  IF v_attempt.answers ? p_question THEN
    v_selected := (v_attempt.answers ->> p_question)::int;
  ELSE
    v_selected := p_selected;
    UPDATE public.quiz_attempts
      SET answers = answers || jsonb_build_object(p_question, p_selected)
      WHERE id = v_attempt.id
      RETURNING * INTO v_attempt;
  END IF;

  SELECT count(*) INTO v_total
  FROM public.questions WHERE bank = 'quiz' AND module_id = v_module;

  SELECT count(*) INTO v_answered
  FROM public.questions q
  WHERE q.bank = 'quiz' AND q.module_id = v_module AND v_attempt.answers ? q.id;

  IF v_answered >= v_total THEN
    SELECT count(*) INTO v_score
    FROM public.questions q
    JOIN public.answer_keys k ON k.question_id = q.id
    WHERE q.bank = 'quiz' AND q.module_id = v_module
      AND (v_attempt.answers ->> q.id)::int = k.correct_index;

    v_passed := v_score * 100 >= v_total * public._course_setting('quiz_pass_pct');

    UPDATE public.quiz_attempts
      SET score = v_score, total = v_total, passed = v_passed, finished_at = now()
      WHERE id = v_attempt.id;

    UPDATE public.module_progress
      SET quiz_best_score = GREATEST(COALESCE(quiz_best_score, 0), v_score),
          quiz_total = v_total,
          quiz_passed_at = CASE WHEN v_passed THEN COALESCE(quiz_passed_at, now()) ELSE quiz_passed_at END,
          updated_at = now()
      WHERE user_id = v_uid AND module_id = v_module;
  END IF;

  RETURN jsonb_build_object(
    'question_id',   p_question,
    'selected',      v_selected,
    'is_correct',    v_selected = v_key.correct_index,
    'correct_index', v_key.correct_index,
    'explanation',   v_key.explanation,
    'answered',      v_answered,
    'total',         v_total,
    'finished',      v_answered >= v_total,
    'score',         v_score,
    'passed',        v_passed
  );
END;
$$;

-- Abandona el intento abierto (para "volver a empezar" las preguntas).
CREATE OR REPLACE FUNCTION public.restart_quiz(p_module text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid uuid := public._require_uid();
BEGIN
  DELETE FROM public.quiz_attempts
  WHERE user_id = v_uid AND module_id = p_module AND finished_at IS NULL;
END;
$$;

-- Respuestas ya dadas en el intento abierto (para retomar tras recargar).
CREATE OR REPLACE FUNCTION public.get_open_quiz(p_module text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid uuid := public._require_uid();
  v_result jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'question_id',   q.id,
           'selected',      (a.answers ->> q.id)::int,
           'is_correct',    (a.answers ->> q.id)::int = k.correct_index,
           'correct_index', k.correct_index,
           'explanation',   k.explanation
         ) ORDER BY q.position), '[]'::jsonb)
  INTO v_result
  FROM public.quiz_attempts a
  JOIN public.questions q ON q.bank = 'quiz' AND q.module_id = a.module_id AND a.answers ? q.id
  JOIN public.answer_keys k ON k.question_id = q.id
  WHERE a.user_id = v_uid AND a.module_id = p_module AND a.finished_at IS NULL;

  RETURN v_result;
END;
$$;

-- =====================================================================
-- Paso 3: práctica
-- =====================================================================
CREATE OR REPLACE FUNCTION public.complete_practice(p_module text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid uuid := public._require_uid();
BEGIN
  PERFORM public._assert_module_unlocked(v_uid, p_module);

  UPDATE public.module_progress
    SET practice_done_at = COALESCE(practice_done_at, now()),
        updated_at = now()
    WHERE user_id = v_uid AND module_id = p_module
      AND quiz_passed_at IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aprueba primero las preguntas de este módulo.' USING ERRCODE = '42501';
  END IF;
END;
$$;

-- =====================================================================
-- Examen final
-- =====================================================================
CREATE OR REPLACE FUNCTION public._grade_exam(p_attempt uuid, p_status text)
RETURNS public.exam_attempts
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_row   public.exam_attempts;
  v_score int;
  v_total int;
BEGIN
  SELECT * INTO v_row FROM public.exam_attempts WHERE id = p_attempt FOR UPDATE;

  v_total := cardinality(v_row.question_ids);
  SELECT count(*) INTO v_score
  FROM unnest(v_row.question_ids) AS qid
  JOIN public.answer_keys k ON k.question_id = qid
  WHERE (v_row.answers ->> qid)::int = k.correct_index;

  UPDATE public.exam_attempts
    SET score = v_score,
        total = v_total,
        passed = v_score * 100 >= v_total * public._course_setting('exam_pass_pct'),
        submitted_at = now(),
        status = p_status
    WHERE id = p_attempt
    RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- Cierra intentos cuyo plazo (más gracia) ya venció, con lo guardado.
CREATE OR REPLACE FUNCTION public._expire_stale_exams(p_uid uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_id uuid;
BEGIN
  FOR v_id IN
    SELECT id FROM public.exam_attempts
    WHERE user_id = p_uid AND status = 'in_progress'
      AND now() > deadline + make_interval(secs => public._course_setting('exam_grace_seconds'))
  LOOP
    PERFORM public._grade_exam(v_id, 'expired');
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public._exam_payload(p_attempt uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'attempt_id', a.id,
    'deadline',   a.deadline,
    'server_now', now(),
    'violations', a.violations,
    'max_violations', public._course_setting('exam_max_violations'),
    'answers',    a.answers,
    'questions',  (
      SELECT jsonb_agg(jsonb_build_object(
               'id', q.id, 'topic', q.topic, 'prompt', q.prompt, 'options', q.options
             ) ORDER BY t.ord)
      FROM unnest(a.question_ids) WITH ORDINALITY AS t(qid, ord)
      JOIN public.questions q ON q.id = t.qid
    )
  )
  FROM public.exam_attempts a
  WHERE a.id = p_attempt;
$$;

CREATE OR REPLACE FUNCTION public.exam_status()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid          uuid := public._require_uid();
  v_total_mods   int;
  v_done_mods    int;
  v_used         int;
  v_passed       boolean;
  v_best         int;
  v_best_total   int;
  v_active       uuid;
BEGIN
  PERFORM public._expire_stale_exams(v_uid);

  SELECT count(*) INTO v_total_mods FROM public.course_modules;
  SELECT count(*) INTO v_done_mods
  FROM public.module_progress
  WHERE user_id = v_uid AND practice_done_at IS NOT NULL;

  SELECT count(*) FILTER (WHERE status <> 'in_progress'),
         COALESCE(bool_or(passed), false)
  INTO v_used, v_passed
  FROM public.exam_attempts WHERE user_id = v_uid;

  SELECT score, total INTO v_best, v_best_total
  FROM public.exam_attempts
  WHERE user_id = v_uid AND status <> 'in_progress'
  ORDER BY score DESC NULLS LAST, submitted_at
  LIMIT 1;

  SELECT id INTO v_active
  FROM public.exam_attempts WHERE user_id = v_uid AND status = 'in_progress';

  RETURN jsonb_build_object(
    'eligible',         v_done_mods >= v_total_mods,
    'modules_done',     v_done_mods,
    'modules_total',    v_total_mods,
    'attempts_used',    v_used,
    'max_attempts',     public._course_setting('exam_max_attempts'),
    'passed',           v_passed,
    'best_score',       v_best,
    'best_total',       v_best_total,
    'active_attempt',   v_active,
    'question_count',   public._course_setting('exam_questions'),
    'minutes',          public._course_setting('exam_minutes'),
    'pass_pct',         public._course_setting('exam_pass_pct'),
    'max_violations',   public._course_setting('exam_max_violations')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.start_exam()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid    uuid := public._require_uid();
  v_status jsonb;
  v_id     uuid;
  v_ids    text[];
BEGIN
  v_status := public.exam_status();  -- también vence intentos viejos

  IF (v_status ->> 'active_attempt') IS NOT NULL THEN
    RETURN public._exam_payload((v_status ->> 'active_attempt')::uuid);
  END IF;

  IF NOT (v_status ->> 'eligible')::boolean THEN
    RAISE EXCEPTION 'Completa los % módulos antes del examen final.', v_status ->> 'modules_total'
      USING ERRCODE = '42501';
  END IF;
  IF (v_status ->> 'passed')::boolean THEN
    RAISE EXCEPTION 'Ya aprobaste el examen final.' USING ERRCODE = '42501';
  END IF;
  IF (v_status ->> 'attempts_used')::int >= public._course_setting('exam_max_attempts') THEN
    RAISE EXCEPTION 'Ya usaste tus % intentos del examen.', public._course_setting('exam_max_attempts')
      USING ERRCODE = '42501';
  END IF;

  SELECT array_agg(id) INTO v_ids
  FROM (
    SELECT id FROM public.questions
    WHERE bank = 'exam'
    ORDER BY random()
    LIMIT public._course_setting('exam_questions')
  ) s;

  IF v_ids IS NULL THEN
    RAISE EXCEPTION 'El banco de preguntas del examen está vacío.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.exam_attempts (user_id, deadline, question_ids)
  VALUES (v_uid, now() + make_interval(mins => public._course_setting('exam_minutes')), v_ids)
  RETURNING id INTO v_id;

  RETURN public._exam_payload(v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_active_exam()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid uuid := public._require_uid();
  v_id  uuid;
BEGIN
  PERFORM public._expire_stale_exams(v_uid);
  SELECT id INTO v_id FROM public.exam_attempts
  WHERE user_id = v_uid AND status = 'in_progress';
  IF v_id IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN public._exam_payload(v_id);
END;
$$;

-- Guarda respuestas parciales (solo de preguntas del intento y dentro del plazo).
CREATE OR REPLACE FUNCTION public.save_exam_answers(p_attempt uuid, p_answers jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid uuid := public._require_uid();
  v_row public.exam_attempts;
  v_clean jsonb;
BEGIN
  SELECT * INTO v_row FROM public.exam_attempts
  WHERE id = p_attempt AND user_id = v_uid AND status = 'in_progress'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Este intento ya no está activo.' USING ERRCODE = '42501';
  END IF;
  IF now() > v_row.deadline + interval '5 seconds' THEN
    RAISE EXCEPTION 'Se acabó el tiempo del examen.' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_object_agg(e.key, (e.value #>> '{}')::int), '{}'::jsonb)
  INTO v_clean
  FROM jsonb_each(COALESCE(p_answers, '{}'::jsonb)) e
  WHERE e.key = ANY (v_row.question_ids)
    AND jsonb_typeof(e.value) = 'number';

  UPDATE public.exam_attempts SET answers = answers || v_clean WHERE id = p_attempt;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_exam_event(p_attempt uuid, p_type text)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid uuid := public._require_uid();
  v_violations int;
BEGIN
  IF p_type NOT IN ('fullscreen_exit', 'tab_hidden', 'window_blur', 'copy_attempt', 'context_menu', 'resumed') THEN
    RAISE EXCEPTION 'Tipo de evento no válido.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.exam_attempts
    SET violations = violations
        + CASE WHEN p_type IN ('fullscreen_exit', 'tab_hidden', 'window_blur') THEN 1 ELSE 0 END
    WHERE id = p_attempt AND user_id = v_uid AND status = 'in_progress'
    RETURNING violations INTO v_violations;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Este intento ya no está activo.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.exam_events (attempt_id, user_id, type) VALUES (p_attempt, v_uid, p_type);
  RETURN v_violations;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_exam(p_attempt uuid, p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid    uuid := public._require_uid();
  v_row    public.exam_attempts;
  v_late   boolean;
  v_left   int;
  v_review jsonb;
  v_topics jsonb;
BEGIN
  SELECT * INTO v_row FROM public.exam_attempts
  WHERE id = p_attempt AND user_id = v_uid AND status = 'in_progress';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Este intento ya no está activo.' USING ERRCODE = '42501';
  END IF;

  v_late := now() > v_row.deadline
            + make_interval(secs => public._course_setting('exam_grace_seconds'));

  -- Fuera de plazo se ignoran respuestas nuevas: cuenta solo lo guardado a tiempo.
  IF NOT v_late AND p_answers IS NOT NULL THEN
    UPDATE public.exam_attempts
      SET answers = answers || COALESCE((
        SELECT jsonb_object_agg(e.key, (e.value #>> '{}')::int)
        FROM jsonb_each(p_answers) e
        WHERE e.key = ANY (v_row.question_ids) AND jsonb_typeof(e.value) = 'number'
      ), '{}'::jsonb)
      WHERE id = p_attempt;
  END IF;

  v_row := public._grade_exam(p_attempt, CASE WHEN v_late THEN 'expired' ELSE 'submitted' END);

  SELECT public._course_setting('exam_max_attempts') - count(*)
  INTO v_left
  FROM public.exam_attempts WHERE user_id = v_uid AND status <> 'in_progress';

  -- Temas a repasar (siempre) y revisión detallada solo si aprobó o ya no le quedan intentos,
  -- para que el examen no se convierta en una lista de respuestas para el siguiente intento.
  SELECT COALESCE(jsonb_agg(DISTINCT q.topic), '[]'::jsonb) INTO v_topics
  FROM unnest(v_row.question_ids) AS qid
  JOIN public.questions q ON q.id = qid
  JOIN public.answer_keys k ON k.question_id = qid
  WHERE (v_row.answers ->> qid)::int IS DISTINCT FROM k.correct_index;

  IF v_row.passed OR v_left <= 0 THEN
    SELECT jsonb_agg(jsonb_build_object(
             'id', q.id, 'topic', q.topic, 'prompt', q.prompt, 'options', q.options,
             'selected', (v_row.answers ->> q.id)::int,
             'correct_index', k.correct_index,
             'explanation', k.explanation
           ) ORDER BY t.ord)
    INTO v_review
    FROM unnest(v_row.question_ids) WITH ORDINALITY AS t(qid, ord)
    JOIN public.questions q ON q.id = t.qid
    JOIN public.answer_keys k ON k.question_id = t.qid;
  END IF;

  RETURN jsonb_build_object(
    'score',          v_row.score,
    'total',          v_row.total,
    'passed',         v_row.passed,
    'status',         v_row.status,
    'pass_pct',       public._course_setting('exam_pass_pct'),
    'attempts_left',  GREATEST(v_left, 0),
    'topics_to_review', v_topics,
    'review',         v_review
  );
END;
$$;

-- =====================================================================
-- Permisos de ejecución: solo usuarios autenticados, y nunca los helpers "_".
-- =====================================================================
REVOKE ALL ON FUNCTION
  public._course_setting(text),
  public._require_uid(),
  public._module_unlocked(uuid, text),
  public._assert_module_unlocked(uuid, text),
  public._grade_exam(uuid, text),
  public._expire_stale_exams(uuid),
  public._exam_payload(uuid),
  public.complete_theory(text),
  public.answer_quiz_question(text, int),
  public.restart_quiz(text),
  public.get_open_quiz(text),
  public.complete_practice(text),
  public.exam_status(),
  public.start_exam(),
  public.get_active_exam(),
  public.save_exam_answers(uuid, jsonb),
  public.log_exam_event(uuid, text),
  public.submit_exam(uuid, jsonb)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.complete_theory(text),
  public.answer_quiz_question(text, int),
  public.restart_quiz(text),
  public.get_open_quiz(text),
  public.complete_practice(text),
  public.exam_status(),
  public.start_exam(),
  public.get_active_exam(),
  public.save_exam_answers(uuid, jsonb),
  public.log_exam_event(uuid, text),
  public.submit_exam(uuid, jsonb)
TO authenticated;
