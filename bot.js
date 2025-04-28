const TelegramBot = require('node-telegram-bot-api');

const token = '7268248925:AAHmWrNJvOWIsq1SroDGX_Awro7pWDHWcuI';
// Массив с ролями пользователей
const users = {
    '6924074231': 'owner', // Пример владельца (userId -> роль)
    '1234567890': 'tech.admin', // Пример технического администратора
    '9876543210': 'admin' // Пример обычного администратора
};

const groupChatId = '-1002543988238'; // ID вашей группы

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
        default:
            greetingMessage = 'Привет, пользователь!';
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

bot.on('message', (msg) => {
    console.log(msg.chat.id); // ID чата будет выводиться в консоль
});


// Обработка команды /test Салам
bot.onText(/\/test (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;  // Получаем userId пользователя
    const messageToSend = match[1];

    // Проверка, является ли пользователь администратором
    if (adminUserIds.includes(userId.toString())) {
        const userName = msg.from.username ? `@${msg.from.username}` : 'Неизвестный'; // Получаем username

        // Формируем сообщение с username сначала, а потом текст
        const formattedMessage = `Сообщение от администратора ${userName}\n\n${messageToSend}`;

        // Отправляем сообщение в группу
        bot.sendMessage(groupChatId, formattedMessage);
    } else {
        // Если пользователь не администратор, отправляем сообщение о запрете
        bot.sendMessage(chatId, 'У вас нет прав для выполнения этой команды.');
    }
});

bot.on('polling_error', (error) => {
    console.log(error);  // Логируем ошибку
  });