# FPV Drone Builder — Production Package

Это готовый пакет для публикации сайта FPV Drone Builder.

## Что уже сделано

- Frontend сайта
- Backend API на Node.js + Express
- SQLite база компонентов
- API компонентов
- API анализа сборки
- API сохранения билдов
- SEO meta tags
- robots.txt
- sitemap.xml
- Privacy Policy
- Support page
- render.yaml для деплоя на Render

## Локальный запуск

```bash
npm install
npm start
```

Открой:

```text
http://localhost:3000
```

## Деплой на Render

1. Создай аккаунт на GitHub.
2. Создай новый репозиторий.
3. Загрузи туда все файлы из этого проекта.
4. Создай аккаунт на Render.
5. Нажми New → Web Service.
6. Подключи GitHub репозиторий.
7. Render сам увидит `render.yaml`.
8. Нажми Deploy.
9. Получишь ссылку вида:

```text
https://fpv-drone-builder.onrender.com
```

## После деплоя

Открой:

```text
https://твоя-ссылка.onrender.com/robots.txt
https://твоя-ссылка.onrender.com/sitemap.xml
https://твоя-ссылка.onrender.com/privacy.html
https://твоя-ссылка.onrender.com/support.html
```

## Чтобы Google начал находить сайт

1. Купи домен или используй ссылку Render.
2. Открой Google Search Console.
3. Добавь сайт.
4. Подтверди владение.
5. Отправь sitemap:

```text
https://твой-домен/sitemap.xml
```

## Важно

В бесплатном Render SQLite база может сбрасываться при redeploy/restart. Для настоящего production лучше позже заменить SQLite на PostgreSQL.
