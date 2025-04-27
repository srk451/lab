// Открытие модального окна при клике на кнопку "Войти"
document.getElementById('loginBtn').onclick = function() {
    document.getElementById('loginModal').style.display = 'block';
};

// Закрытие модального окна
document.getElementById('closeModal').onclick = function() {
    document.getElementById('loginModal').style.display = 'none';
};

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    if (event.target == document.getElementById('loginModal')) {
        document.getElementById('loginModal').style.display = 'none';
    }
};

// Проверка логина и пароля при отправке формы
document.getElementById('loginForm').onsubmit = function(e) {
    e.preventDefault();

    // Получаем логин и пароль
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Пример проверки логина и пароля
    if (username === 'lab' && password === '1234') {
        // Закрытие модального окна
        document.getElementById('loginModal').style.display = 'none';
        
        // Перенаправление на страницу lab_dashboard.html
        window.location.href = './images/lab_dashboard.html';
    } else {
        alert('Неверный логин или пароль');
    }
};