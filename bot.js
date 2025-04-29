const TelegramBot = require('node-telegram-bot-api');

// Токен бота
const token = '7268248925:AAHmWrNJvOWIsq1SroDGX_Awro7pWDHWcuI';

// Массив с ролями пользователей (пример)
const users = {
    '6924074231': 'owner', // Пример владельца
    '1234567890': 'tech.admin', // Пример технического администратора
    '9876543210': 'admin', // Пример обычного администратора
    '12312414': 'director' // Пример директора
};

const groupChatId = '-1002543988238'; // ID вашей группы
const adminChatId = '1234567890'; // Chat ID для отправки запросов администратору
const adminUserIds = ['1234567890', '9876543210']; // Список ID администраторов

// Создаем бота с поллингом
const bot = new TelegramBot(token, { polling: true });

// Слушаем команду /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;  // Получаем userId пользователя

    // Проверяем, если этот пользователь зарегистрирован в массиве
    const userRole = users[userId] || 'user'; // Если не найден, то обычный пользователь

    // Приветствие в зависимости от роли
    let greetingMessage = '';
    switch (userRole) {
        case 'owner':
            greetingMessage = 'Привет, Mark Travmatov!';
            break;
        case 'tech.admin':
            greetingMessage = 'Привет, Svyatoslav Travmatov!';
            break;
        case 'admin':
            greetingMessage = 'Привет, администратор!';
            break;
        case 'director':
            greetingMessage = 'Привет, Директор FBI!';
            break;
        default:
            greetingMessage = 'Добро пожаловать в нашу систему!\n\nУ вас нет зарегистрированной учетной записи. Свяжитесь с администратором для получения доступа.\n\nАдминистраторы:\n@sakurariley - tech.admin\n@JUMBO196 - tech.admin';
    }

    bot.sendMessage(chatId, greetingMessage);
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

// Обработка команды /test Салам
bot.onText(/\/test (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString(); // ID пользователя в виде строки
    const messageToSend = match[1];

    const userRole = users[userId];

    // Разрешённые роли
    const allowedRoles = ['owner', 'admin', 'tech.admin', 'director'];

    if (allowedRoles.includes(userRole)) {
        const userName = msg.from.username ? `@${msg.from.username}` : 'Неизвестный';
        const formattedMessage = `Сообщение от администратора ${userName}\n\n${messageToSend}`;
        bot.sendMessage(groupChatId, formattedMessage);
    } else {
        bot.sendMessage(chatId, 'У вас нет прав для выполнения этой команды.');
    }
});

// Логируем все сообщения
bot.on('message', (msg) => {
    console.log(msg.chat.id); // ID чата будет выводиться в консоль
});

// Обработка ошибок
bot.on('polling_error', (error) => {
    console.log(error);  // Логируем ошибку
});

// Если используете express сервер, вот как он может выглядеть:
const express = require('express');
const app = express();

// Простой роут для запуска сервера (например, на платформе типа Heroku)
app.get('/', (req, res) => {
    res.send('Bot is running!');
});

// Используем порт от Heroku, если он задан, или порт 3000 для локальной разработки
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});