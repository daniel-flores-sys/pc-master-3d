# PC Master 3D

Curso guiado para estudiantes de colegio sobre mantenimiento preventivo y correctivo de computadoras,
laptops y celulares. Se aprende **leyendo, viendo y haciendo**:

1. **Teoría** en tarjetas cortas, una a la vez, con glosario y el componente resaltado en un modelo 3D.
2. **Preguntas** de cada módulo, calificadas en el servidor con explicación inmediata (aprobar con 70 %).
3. **Práctica**: misiones en el modelo 3D, casos de diagnóstico o procedimientos guiados de taller.
4. **Examen final** de 20 preguntas en pantalla completa, 30 minutos y 2 intentos.

El avance se guarda por estudiante y se muestra en un roadmap al estilo de roadmap.sh.

- Frontend: React 19 + Vite + Tailwind 4 + Three.js, publicado en GitHub Pages.
- Backend: [InsForge](https://insforge.dev) (auth, Postgres con RLS y funciones SQL).

## Arrancar en local

```bash
npm install
cp .env.example .env.local    # completa VITE_INSFORGE_URL y VITE_INSFORGE_ANON_KEY
npm run dev                   # http://localhost:3000
```

Otros comandos: `npm run lint` (tipos), `npm test` (lógica del curso), `npm run build`.

## Estructura

| Carpeta | Contenido |
|---|---|
| `src/content/` | Módulos, teoría, prácticas y glosario (público) |
| `src/pages/` | Landing, registro, roadmap, módulo (teoría/preguntas/práctica), examen, laboratorio |
| `src/theme/` + `src/index.css` | 4 paletas × claro/oscuro como variables CSS |
| `src/three/` | Modelos 3D generados por código |
| `migrations/` | Esquema, RLS y funciones de calificación (InsForge) |
| `scripts/build-seed.mjs` | Genera el SQL del banco de preguntas |
| `scripts/verify-backend.mjs` | Pruebas de seguridad del backend (crea usuarios `qa-*@example.com`) |
| `content-private/` | **No se sube.** Banco de preguntas con respuestas |

## Banco de preguntas (privado)

Las respuestas correctas **nunca** están en el código público ni llegan al navegador: viven en la tabla
`answer_keys`, inaccesible para los estudiantes, y solo las leen las funciones que califican.

La fuente es `content-private/question-bank.mjs` (ignorado por git). **Guarda una copia aparte.**
Para cargar cambios:

```bash
npm run seed:push
```

## Publicar en GitHub Pages

1. En GitHub: *Settings → Pages → Source: GitHub Actions*.
2. La URL y la anon key de InsForge del build están en `.env.production` (son públicas por diseño).
3. Cada push a `main` compila y publica en `https://<usuario>.github.io/pc-master-3d/`.

La URL publicada debe estar en `allowed_redirect_urls` de `insforge.toml` (`npx -y @insforge/cli config apply`).

## Límites conocidos

- **Examen:** un navegador no puede impedir del todo que alguien salga (Esc, Alt+Tab, otro dispositivo).
  El sistema disuade y deja registro: bloquea la pantalla, cuenta advertencias (3 = entrega automática),
  bloquea la navegación interna y controla el tiempo desde el servidor.
- **Safari** bloquea cookies de terceros: puede pedir iniciar sesión otra vez al recargar.
- La práctica se valida en el navegador; las preguntas y el examen se califican en el servidor.
