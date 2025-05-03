// Показать модальное окно при клике на кнопку
document.getElementById('loginBtn').onclick = function () {
    document.getElementById('loginModal').style.display = 'block';
};

// Закрытие модального окна
document.getElementById('closeModal').onclick = function () {
    document.getElementById('loginModal').style.display = 'none';
};

// Закрытие модального окна при клике вне его
window.onclick = function (event) {
    if (event.target == document.getElementById('loginModal')) {
        document.getElementById('loginModal').style.display = 'none';
    }
};

// Список пользователей с закодированными логинами и паролями
const users = {
    "c3Jr": { password: "c2lzZW1iYWV2", role: "owner" },
    "YWRtaW5jYXZhbGxp": { password: "Y2F2aGxhYnRvcA==", role: "admin" },
    "bGFidmxhZGRpc2VsbGFi": { password: "ZGlzZWxsYWJvcmFudHRvcA==", role: "laborant" },
    "bGFicGV0b2Jlcmx1c2xhYg==": { password: "bGFib3JhbnRwZXRvdG9w", role: "laborant" },
    "bGFibGFibWlzaGF2b3Jvbm92": { password: "bGFib3JhbnRtaXNoYWxhYnhk", role: "laborant" }
};

// Проверка роли пользователя и скрытие кнопки "Войти" для user
function checkUserRole() {
    const role = sessionStorage.getItem('role');
    const loginBtn = document.getElementById('loginBtn');

    if (loginBtn && role === 'user') {
        loginBtn.classList.add('hidden'); // Скрываем через CSS
    }
}
// Обработка формы входа
document.getElementById('loginForm').onsubmit = function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    const encodedUsername = btoa(username);
    const encodedPassword = btoa(password);

    if (users[encodedUsername] && users[encodedUsername].password === encodedPassword) {
        const role = users[encodedUsername].role;
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('role', role);
        sessionStorage.setItem('username', username); // 👈 добавлено
        sessionStorage.setItem('password', password);

        checkUserRole(); // 👈 ВАЖНО: вызываем после входа

        document.getElementById('loginModal').style.display = 'none';
        window.location.href = './images/lab_dashboard.html';
    } else {
        alert('Неверный логин или пароль');
    }
};

// При загрузке страницы тоже проверим роль
window.onload = function () {
    checkUserRole();
};