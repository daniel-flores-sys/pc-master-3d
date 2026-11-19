-- Índices para las claves foráneas señaladas por el advisor de InsForge.
CREATE INDEX IF NOT EXISTS questions_module_id_idx       ON public.questions (module_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_module_id_idx   ON public.quiz_attempts (module_id);
CREATE INDEX IF NOT EXISTS module_progress_module_id_idx ON public.module_progress (module_id);
CREATE INDEX IF NOT EXISTS exam_events_user_id_idx       ON public.exam_events (user_id);
