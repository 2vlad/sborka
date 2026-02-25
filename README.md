# Сборка

Генеративная образовательная платформа. Введите запрос — получите структурированный учебный курс с квизами, практикой и иллюстрациями.

![Python](https://img.shields.io/badge/Python-3.11+-blue) ![React](https://img.shields.io/badge/React-19-61DAFB) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688) ![License](https://img.shields.io/badge/license-MIT-green)

## Как это работает

1. Пользователь вводит образовательный запрос (например, «хочу разобраться в модулях JS»)
2. Система определяет масштаб: урок / тема / модуль / профессия
3. Строит структуру (оглавление) до уровня уроков
4. Генерирует первый урок в реальном времени через стриминг
5. Параллельно создаёт иллюстрации — в тексте заранее появляются плейсхолдеры, картинки подставляются без скачков вёрстки

Весь процесс виден пользователю: классификация, структура, контент — всё появляется инкрементально через Server-Sent Events.

## Стек

| Слой | Технологии |
|------|-----------|
| **Backend** | Python, FastAPI, SQLAlchemy 2.0 (async), Pydantic |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Zustand |
| **LLM** | OpenRouter (Claude Sonnet по умолчанию) |
| **Изображения** | OpenRouter (Gemini) |
| **БД** | SQLite (локально) / PostgreSQL (продакшен) |
| **Стриминг** | Server-Sent Events (SSE) |
| **Деплой** | Railway, Docker (multi-stage) |

## Быстрый старт

### Требования

- Python 3.11+
- Node.js 20+
- Ключ [OpenRouter API](https://openrouter.ai/)

### Установка

```bash
git clone https://github.com/2vlad/sborka.git
cd sborka

# Установить зависимости
make install

# Настроить переменные окружения
cp .env.example .env
# Добавить OPENROUTER_API_KEY в .env
```

### Запуск

```bash
# Два терминала:
make dev-backend   # Backend → http://localhost:8000
make dev-frontend  # Frontend → http://localhost:5173

# Или одной командой:
make dev
```

### Тесты и линтинг

```bash
make test   # pytest
make lint   # ruff + eslint
```

## Архитектура

```
Запрос пользователя
    │
    ▼
Classifier ─── определяет масштаб (урок/тема/модуль/профессия)
    │           и строит outline (дерево контента)
    ▼
Scaffolder ─── создаёт каркас урока: 12 типизированных блоков
    │           + плейсхолдеры под изображения
    ▼
Filler ─────── заполняет блоки контентом (markdown, квизы, практика)
    │           через стриминг SSE-событий
    ▼
Images ─────── параллельная генерация иллюстраций
               подстановка в зарезервированные блоки
```

### Типы блоков

`heading` · `markdown` · `quiz_single` · `quiz_multi` · `practice_task` · `dialog` · `callout` · `image`

### SSE-события

Фронтенд подписывается на типизированные события (не сырой поток токенов):

`session_created` → `classification_ready` → `outline_ready` → `lesson_scaffold_ready` → `block_started` → `block_delta` → `block_ready` → `asset_ready` → `done`

## Структура проекта

```
├── backend/
│   ├── app/
│   │   ├── api/            # REST-эндпоинты (sessions, generate)
│   │   ├── pipeline/       # Генеративный пайплайн (classifier, scaffolder, filler, images)
│   │   ├── schemas/        # Pydantic-схемы (блоки, события, сессии)
│   │   ├── sse/            # EventBus + SSE encoder
│   │   ├── models/         # SQLAlchemy-модели (Session, Lesson, Asset)
│   │   └── llm/            # OpenRouter-клиент + промпты
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/     # React-компоненты (LessonView, Sidebar, блоки)
│       ├── store/          # Zustand (обработка SSE-событий)
│       ├── pages/          # LandingPage, SessionPage
│       └── api/            # REST + SSE клиенты
├── docs/                   # Документация проекта
├── PRD.txt                 # Product Requirements Document
├── Dockerfile              # Multi-stage сборка (Node → Python)
└── Makefile                # install, dev, test, lint
```

## Деплой

Проект деплоится на [Railway](https://railway.app) через git push в main:

```bash
git push origin main
# Railway автоматически собирает и деплоит из Dockerfile
```

Продакшен: https://sborka-production.up.railway.app

### Переменные окружения

| Переменная | Обязательна | Описание |
|-----------|:-----------:|---------|
| `OPENROUTER_API_KEY` | да | Ключ API OpenRouter |
| `DATABASE_URL` | нет | URI базы данных (по умолчанию SQLite) |
| `LLM_MODEL` | нет | Модель для генерации (по умолчанию `anthropic/claude-sonnet-4.6`) |
| `IMAGE_MODEL` | нет | Модель для изображений (по умолчанию `google/gemini-3-pro-image-preview`) |
| `SENTRY_DSN` | нет | DSN для мониторинга ошибок |

## Лицензия

MIT
