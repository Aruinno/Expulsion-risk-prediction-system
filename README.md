# RiskRadar 📡 — Backend + Frontend

Система предсказания риска отчисления студентов с полноценным REST API и JSON-базой данных.

## 🚀 Запуск

```bash
# 1. Установить зависимости (один раз)
npm install

# 2. Запустить сервер
npm start
# или
node server.js

# 3. Открыть в браузере
# http://localhost:3000
```

## 📁 Структура

```
riskradar/
├── server.js          # Express backend (REST API)
├── db.json            # База данных (создаётся автоматически)
├── package.json
├── public/
│   └── index.html     # Фронтенд (SPA)
└── README.md
```

## 🔌 REST API

| Метод    | URL                      | Описание                    |
|----------|--------------------------|-----------------------------|
| GET      | /api/disciplines         | Список дисциплин            |
| POST     | /api/disciplines         | Добавить дисциплину         |
| DELETE   | /api/disciplines/:id     | Удалить дисциплину          |
| GET      | /api/students            | Список студентов (?q=поиск) |
| GET      | /api/students/:id        | Один студент                |
| POST     | /api/students            | Добавить студента           |
| PUT      | /api/students/:id        | Обновить студента           |
| DELETE   | /api/students/:id        | Удалить студента            |
| GET      | /api/stats               | Статистика (риски)          |

## 🗄️ База данных

Данные хранятся в `db.json`. При первом запуске автоматически создаётся с тестовыми студентами и дисциплинами.

## 🔧 Расширение

Для замены JSON на SQLite:
```bash
npm install better-sqlite3  # требует python3 и build tools
```

Для PostgreSQL:
```bash
npm install pg
```
