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

// Зашифрованные логины и пароли (в base64 формате)
const users = {
    "c3Jr": "c2lzZW1iYWV2",
    "Y2F2YWxsaQ==": "Y2F2YWxsaTEyMzQ=",
    "bGFi": "MTIzNA=="
    // можешь добавить ещё пользователей сюда
};

// Проверка логина и пароля при отправке формы
document.getElementById('loginForm').onsubmit = function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    const encodedUsername = btoa(username);
    const encodedPassword = btoa(password);

    if (users[encodedUsername] && users[encodedUsername] === encodedPassword) {
        document.getElementById('loginModal').style.display = 'none';
        window.location.href = './images/lab_dashboard.html';
    } else {
        alert('Неверный логин или пароль');
    }
};