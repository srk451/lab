// Данные пользователя
const currentUser = {
    id: 1,
    name: 'Александр П.',
    position: 'Head of Lab',
    avatar: 'АП'
};

// Демо пользователи
const users = [
    {
        id: 2,
        name: 'Елена С.',
        position: 'Старший лаборант',
        avatar: 'ЕС'
    },
    {
        id: 3,
        name: 'Максим К.',
        position: 'Аналитик',
        avatar: 'МК'
    },
    {
        id: 4,
        name: 'Ирина В.',
        position: 'Лаборант-исследователь',
        avatar: 'ИВ'
    }
];

// Демо сообщения
const initialMessages = [
    {
        id: 1,
        userId: 2,
        text: 'Добрый день, коллеги! Образцы проекта XA-124 готовы к анализу.',
        time: '09:15'
    },
    {
        id: 2,
        userId: 3,
        text: 'Спасибо, Елена. Я заберу их через 30 минут.',
        time: '09:20'
    },
    {
        id: 3,
        userId: 4,
        text: 'Не забудьте про калибровку спектрометра, он вчера показывал смещение.',
        time: '09:23'
    },
    {
        id: 4,
        userId: 1,
        text: 'Коллеги, пожалуйста, внесите все данные в новую систему до 15:00. Сегодня финальный день отчетности.',
        time: '09:30'
    }
];

// Хранилище сообщений
let messages = [...initialMessages];

// Звук уведомления
const notificationSound = new Audio('notification.mp3');

// DOM элементы
let chatMessages;
let messageInput;
let sendButton;
let navItems;

// Инициализация портала
function initPortal() {
    // Получаем DOM элементы
    chatMessages = document.getElementById('chat-messages');
    messageInput = document.getElementById('message-input');
    sendButton = document.getElementById('send-button');
    navItems = document.querySelectorAll('.nav-item');
    
    // Установка обработчиков событий
    setupEventHandlers();
    
    // Рендер сообщений
    renderMessages();
    
    // Установка данных текущего пользователя в интерфейсе
    updateUserProfile();
    
    // Имитация активности других пользователей
    simulateUserActivity();
}

// Установка обработчиков событий
function setupEventHandlers() {
    // Для кнопки отправки сообщения
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
    
    // Для ввода сообщения по Enter
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Для пунктов меню
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Убираем класс active у всех пунктов
            navItems.forEach(i => i.classList.remove('active'));
            // Добавляем класс active текущему пункту
            this.classList.add('active');
            
            // Здесь можно добавить логику загрузки соответствующего раздела
            console.log(`Выбран раздел: ${this.textContent}`);
        });
    });
}

// Определение пользователя
function getCurrentUser() {
    // В реальном приложении здесь может быть запрос к серверу
    return currentUser;
}

// Обновление профиля пользователя в интерфейсе
function updateUserProfile() {
    const user = getCurrentUser();
    const userProfileEl = document.getElementById('current-user-profile');
    
    if (userProfileEl) {
        userProfileEl.querySelector('h3').textContent = user.name;
        userProfileEl.querySelector('.profile-position').textContent = user.position;
    }
}

// Рендер сообщений
function renderMessages() {
    if (!chatMessages) return;
    
    chatMessages.innerHTML = '';
    
    messages.forEach(message => {
        const user = message.userId === currentUser.id 
            ? currentUser 
            : users.find(u => u.id === message.userId);
        
        const isOwnMessage = message.userId === currentUser.id;
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isOwnMessage ? 'own' : ''}`;
        
        if (!isOwnMessage) {
            const avatarEl = document.createElement('div');
            avatarEl.className = 'message-avatar';
            avatarEl.textContent = user.avatar;
            messageEl.appendChild(avatarEl);
        }
        
        const contentEl = document.createElement('div');
        contentEl.className = 'message-content';
        
        const infoEl = document.createElement('div');
        infoEl.className = 'message-info';
        
        const senderEl = document.createElement('div');
        senderEl.className = 'message-sender';
        senderEl.textContent = user.name;
        infoEl.appendChild(senderEl);
        
        const positionEl = document.createElement('div');
        positionEl.className = 'message-position';
        positionEl.textContent = user.position;
        infoEl.appendChild(positionEl);
        
        contentEl.appendChild(infoEl);
        
        const textEl = document.createElement('div');
        textEl.className = 'message-text';
        textEl.textContent = message.text;
        contentEl.appendChild(textEl);
        
        const timeEl = document.createElement('div');
        timeEl.className = 'message-time';
        timeEl.textContent = message.time;
        contentEl.appendChild(timeEl);
        
        messageEl.appendChild(contentEl);
        chatMessages.appendChild(messageEl);
    });
    
    // Прокрутка к последнему сообщению
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Отправка сообщения
function sendMessage() {
    if (!messageInput) return;
    
    const text = messageInput.value.trim();
    if (!text) return;
    
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;
    
    const newMessage = {
        id: messages.length + 1,
        userId: currentUser.id,
        text: text,
        time: time
    };
    
    messages.push(newMessage);
    renderMessages();
    messageInput.value = '';
}

// Получение нового сообщения
function receiveMessage(message) {
    messages.push(message);
    renderMessages();
    
    // Воспроизведение звука уведомления
    if (message.userId !== currentUser.id) {
        playNotificationSound();
    }
}

// Воспроизведение звука уведомления
function playNotificationSound() {
    notificationSound.play().catch(error => {
        console.warn('Не удалось воспроизвести звук уведомления:', error);
    });
}

// Имитация активности других пользователей
function simulateUserActivity() {
    setTimeout(() => {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const newMessage = {
            id: messages.length + 1,
            userId: randomUser.id,
            text: 'Я обновил реестр оборудования, добавил новые калибровочные данные.',
            time: '09:45'
        };
        
        receiveMessage(newMessage);
        
        // Дополнительное сообщение через некоторое время
        setTimeout(() => {
            const anotherUser = users[Math.floor(Math.random() * users.length)];
            const anotherMessage = {
                id: messages.length + 1,
                userId: anotherUser.id,
                text: 'Александр, подтвердите пожалуйста график на следующую неделю.',
                time: '10:05'
            };
            
            receiveMessage(anotherMessage);
        }, 20000);
        
    }, 5000);
}

// Функции для разделов меню
function showDashboard() {
    // Логика отображения главной страницы
    console.log('Загружена главная страница');
}

function showProjects() {
    // Логика отображения проектов
    console.log('Загружены проекты');
}

function showSamples() {
    // Логика отображения образцов
    console.log('Загружены образцы');
}

function showEquipment() {
    // Логика отображения оборудования
    console.log('Загружено оборудование');
}

function showJournal() {
    // Логика отображения журнала
    console.log('Загружен журнал');
}

function showCalendar() {
    // Логика отображения календаря
    console.log('Загружен календарь');
}

function showChat() {
    // Логика отображения чата
    console.log('Загружен чат');
}

function showSettings() {
    // Логика отображения настроек
    console.log('Загружены настройки');
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', initPortal);