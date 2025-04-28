const TelegramBot = require('node-telegram-bot-api');

const token = '7268248925:AAHmWrNJvOWIsq1SroDGX_Awro7pWDHWcuI';
const adminChatId = '6924074231';  // Ваш Telegram User ID

// Создаем бота с поллингом
const bot = new TelegramBot(token, { polling: true });

// Слушаем команду /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Привет! Я твой бот!');
});

// Обработка запроса от формы
bot.onText(/\/send_request (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const requestMessage = match[1];

    // Отправляем уведомление вам (в ЛС)
    bot.sendMessage(adminChatId, `Пользователь оставил запрос: ${requestMessage}`);

    // Отправляем сообщение пользователю
    bot.sendMessage(chatId, 'Ваш запрос был отправлен! Мы с вами свяжемся в ближайшее время.');
});