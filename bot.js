const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

const token = '7268248925:AAHmWrNJvOWIsq1SroDGX_Awro7pWDHWcuI';

// Создаем бота с поллингом
const bot = new TelegramBot(token, { polling: true });

// Слушаем команду /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Привет Тима, это я Serik! Иди нахуй.');
});

// Слушаем любые текстовые сообщения
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (msg.text.toLowerCase() === 'привет') {
        bot.sendMessage(chatId, 'Что привет нахуй. Пошёл Нахуй.');
    } else {
        bot.sendMessage(chatId, 'Напиши "Привет".');
    }
});

// Создаем простой маршрут для поддержания работы бота
app.get('/', (req, res) => {
    res.send('Бот работает!');
});

// Запускаем Express сервер, который слушает на правильном порту
const port = process.env.PORT || 3000;  // Используем PORT от Heroku или 3000, если он не задан
app.listen(port, () => {
    console.log(`Сервер работает на порту ${port}`);
});