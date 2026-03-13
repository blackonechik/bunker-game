# Базовый образ с Node.js 20 на Debian.
# Это уменьшает вероятность DNS-ошибок EAI_AGAIN при обращении к внутренним docker hostname.
FROM node:20-bookworm-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем весь проект
COPY . .

# Собираем Next.js
RUN npm run build

# Для standalone runtime Next.js ожидает public и .next/static рядом с server.js
RUN mkdir -p .next/standalone/.next \
  && cp -R public .next/standalone/public \
  && cp -R .next/static .next/standalone/.next/static

# Устанавливаем порт, который слушает приложение
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

# Запуск приложения
CMD ["npm", "run", "start"]
