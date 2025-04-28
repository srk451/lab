const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser'); // Подключаем body-parser для обработки POST-запросов
const app = express();

const token = '7268248925:AAHmWrNJvOWIsq1SroDGX_Awro7pWDHWcuI';
const adminChatId = '6924074231';  // Ваш Telegram User ID

// Создаем бота с поллингом
const bot = new TelegramBot(token, { polling: true });

// Настройка middleware для обработки JSON и URL-encoded данных
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Слушаем команду /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Привет! Я твой бот!');
});

// Обработка отправки формы через POST-запрос
app.post('/send-request', (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).send('Все поля обязательны для заполнения.');
    }

    const userMessage = `Пользователь оставил запрос.\nИмя: ${name}\nEmail: ${email}\nСообщение: ${message}`;

    // Отправляем уведомление вам (в ЛС)
    bot.sendMessage(adminChatId, userMessage);

    // Отправляем сообщение пользователю
    res.send('Ваш запрос был отправлен! Мы с вами свяжемся в ближайшее время.');
});

// Создаем маршрут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');  // Путь к файлу index.html
});

// Запускаем сервер на порту 3000 или на порту, который настроен в окружении
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Сервер работает на порту ${port}`);
});