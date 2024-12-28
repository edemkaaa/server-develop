const express = require('express');
const app = express();
const authRoutes = require('./routes/auth');
const pool = require('./db');

app.use(express.json());


app.use('/api/auth', authRoutes);


const createUsersTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL
      )
    `);
    console.log('Таблица пользователей готова');
  } catch (err) {
    console.error('Ошибка при создании таблицы:', err);
  }
};

app.listen(3001, async () => {
  await createUsersTable();
  console.log('Сервер запущен на порту 3000');
}); 