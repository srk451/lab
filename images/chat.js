// Список пользователей с закодированными логинами и паролями
const users = {
    "c3Jr": { password: "c2lzZW1iYWV2", role: "owner" }, // srk
    "YWRtaW5jYXZhbGxp": { password: "Y2F2aGxhYnRvcA==", role: "admin" }, // admincavalli
};

// Получаем имя пользователя из sessionStorage
const currentUser = {
    id: sessionStorage.getItem('username'),  // Логин пользователя (например, 'srk')
    role: sessionStorage.getItem('role'),    // Роль пользователя (например, 'owner' или 'admin')
    name: '', // Имя пользователя будет установлено на основе логина
    avatar: 'АП', // Простой аватар (можно заменить на более сложное)
};

let lastMessageCount = 0;  // Будем отслеживать количество сообщений

// Инициализация чата
function initChat() {
    // Проверяем, валиден ли пользователь
    if (!validateUser()) {
        alert('Неверный логин или пароль!');
        window.location.href = '../lab.html'; // Переход на страницу логина, если не прошли валидацию
        return;
    }

    // Обновляем профиль пользователя
    updateUserProfile();

    // Рендерим сообщения из локального хранилища
    renderMessages();

    // Обработчик отправки сообщения
    document.getElementById('send-button').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') sendMessage();
    });

    // Периодическое обновление сообщений
    setInterval(loadNewMessages, 5000);  // Каждые 5 секунд
}

// Функция для загрузки новых сообщений
function loadNewMessages() {
    const storedMessages = JSON.parse(localStorage.getItem('messages')) || [];

    if (storedMessages.length > lastMessageCount) {
        // Обновляем количество сообщений
        const newMessages = storedMessages.slice(lastMessageCount);  // Получаем только новые сообщения
        lastMessageCount = storedMessages.length;

        // Проверка на новые сообщения от других пользователей (не твои)
        const newMessagesFromOthers = newMessages.filter(message => message.userId !== currentUser.name);

        if (newMessagesFromOthers.length > 0) {
            // Если есть новые сообщения от других пользователей, выводим уведомление
            renderMessages();
            notifyNewMessages();  // Уведомление о новых сообщениях
        }
    }
}

// Проверка логина и пароля пользователя
function validateUser() {
    const encodedUsername = btoa(currentUser.id); // Закодированный логин
    const encodedPassword = btoa(sessionStorage.getItem('password')); // Закодированный пароль (который пользователь вводит)

    if (users[encodedUsername] && users[encodedUsername].password === encodedPassword) {
        currentUser.name = currentUser.id; // Устанавливаем имя пользователя
        return true; // Пользователь валидирован
    }

    return false; // Неверный логин или пароль
}

// Обновление профиля пользователя
function updateUserProfile() {
    const userProfileEl = document.getElementById('current-user-profile');
    if (userProfileEl) {
        userProfileEl.querySelector('h3').textContent = currentUser.name;
    }
}

// Рендеринг сообщений
function renderMessages() {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = ''; // Очищаем текущие сообщения

    // Получаем все сообщения из localStorage
    const storedMessages = JSON.parse(localStorage.getItem('messages')) || [];

    storedMessages.forEach(message => {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.userId === currentUser.name ? 'own' : ''}`;
        
        const contentEl = document.createElement('div');
        contentEl.className = 'message-content';

        const senderEl = document.createElement('div');
        senderEl.className = 'message-sender';
        senderEl.textContent = message.userId;

        const textEl = document.createElement('div');
        textEl.className = 'message-text';
        textEl.textContent = message.text;

        const timeEl = document.createElement('div');
        timeEl.className = 'message-time';
        timeEl.textContent = message.time;

        contentEl.appendChild(senderEl);
        contentEl.appendChild(textEl);
        contentEl.appendChild(timeEl);

        messageEl.appendChild(contentEl);
        chatMessages.appendChild(messageEl);
    });

    // Прокручиваем чат к последнему сообщению
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Отправка сообщения
function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const text = messageInput.value.trim();

    if (text) {
        const now = new Date();
        const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        
        const newMessage = {
            userId: currentUser.name,
            text: text,
            time: time
        };

        // Сохраняем сообщение в localStorage
        const storedMessages = JSON.parse(localStorage.getItem('messages')) || [];
        storedMessages.push(newMessage);
        localStorage.setItem('messages', JSON.stringify(storedMessages));

        // Рендерим обновленный список сообщений
        renderMessages();

        // Очистка поля ввода
        messageInput.value = '';
    }
}

// Уведомление о новых сообщениях
function notifyNewMessages() {
    const notificationSound = document.getElementById('notification-sound');
    notificationSound.play();

    // Можно добавить значок уведомления
    const notificationBadge = document.querySelector('.notification-badge');
    if (notificationBadge) {
        notificationBadge.classList.add('has-notifications');
    }
}

// Инициализация чата при загрузке
window.onload = function () {
    initChat();
};