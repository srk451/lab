const TelegramBot = require('node-telegram-bot-api');

// Замените на свой API токен, который вы получили от BotFather
const token = '7268248925:AAHmWrNJvOWIsq1SroDGX_Awro7pWDHWcuI';

// Создаем бота с поллингом
const bot = new TelegramBot(token, { polling: true });

// Слушаем команду /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Привет! Я твой бот!');
});

// Слушаем любые текстовые сообщения
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (msg.text.toLowerCase() === 'привет') {
        bot.sendMessage(chatId, 'Привет, как я могу помочь?');
    } else {
        bot.sendMessage(chatId, 'Я тебя не понял. Напиши "Привет".');
    }
});