// Показать модальное окно при клике на кнопку
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

// Список пользователей с закодированными данными
const users = {
    "c3Jr": { password: "c2lzZW1iYWV2", role: "owner" },
    "Y2F2YWxsaQ==": { password: "Y2F2YWxsaTEyMzQ=", role: "admin" },
    "RmVkZXJhbCBCdXJlYXUgb2YgSW52ZXN0aWdhdGlvbg==": { password: "RkJJdGVzdA==", role: "user" }
};

// Обработка формы входа
document.getElementById('loginForm').onsubmit = function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Кодируем логин и пароль в Base64
    const encodedUsername = btoa(username);
    const encodedPassword = btoa(password);

    // Проверка данных пользователя
    if (users[encodedUsername] && users[encodedUsername].password === encodedPassword) {
        // Сохраняем информацию о логине и роли в sessionStorage
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('role', users[encodedUsername].role); // Роль пользователя

        document.getElementById('loginModal').style.display = 'none';
        window.location.href = './images/lab_dashboard.html';  // Переход на страницу после успешного входа
    } else {
        // Сообщение об ошибке, если логин или пароль неверные
        alert('Неверный логин или пароль');
    }
};