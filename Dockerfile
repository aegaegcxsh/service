# =================================================================
# Dockerfile для Nest.JS + whatsapp-web.js приложения
# =================================================================

# ---- ЭТАП 1: СБОРКА ----
# Используем легковесный образ Node.js для сборки проекта
FROM node:18-slim as builder

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package*.json ./

# Устанавливаем ВСЕ зависимости, включая те, что нужны для разработки и сборки
RUN npm install

# Копируем весь исходный код проекта
COPY . .

# Собираем приложение в продакшн-сборку
RUN npm run build


# ---- ЭТАП 2: ЗАПУСК (ПРОДАКШН) ----
# Используем тот же легковесный образ Node.js для запуска
FROM node:20-slim

# Устанавливаем системные зависимости, необходимые для работы Chromium (используется whatsapp-web.js)
# Это самый важный блок для стабильной работы!
RUN apt-get update \
    && apt-get install -yq --no-install-recommends \
    ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
    libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 \
    libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
    libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
    libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils \
    # Очищаем кэш apt, чтобы уменьшить размер итогового образа
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем ТОЛЬКО зависимости, необходимые для работы приложения (production)
RUN npm install --only=production

# Копируем собранное приложение из этапа "builder"
COPY --from=builder /usr/src/app/dist ./dist

# Указываем порт, на котором будет работать ваше приложение (согласно вашему main.ts)
EXPOSE 8000

# Команда, которая будет выполняться при старте контейнера
CMD ["node", "dist/main"]