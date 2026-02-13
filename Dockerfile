# Базовый образ с Node.js 20
FROM node:20-alpine

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

# Устанавливаем порт, который слушает приложение
ENV PORT=3000

EXPOSE 3000

# Запуск приложения
CMD ["npm", "run", "start", "--", "-H", "0.0.0.0", "-p", "3000"]
