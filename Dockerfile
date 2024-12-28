FROM node:16

# Установка рабочей директории
WORKDIR /usr/src/app

# Копирование package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копирование исходного кода
COPY . .

# Экспонирование порта
EXPOSE 3000

# Команда для запуска приложения
CMD ["node", "src/app.js"] 