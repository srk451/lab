document.getElementById('loginBtn').onclick = function() {
    document.getElementById('loginModal').style.display = 'block';
};

document.getElementById('closeModal').onclick = function() {
    document.getElementById('loginModal').style.display = 'none';
};

window.onclick = function(event) {
    if (event.target == document.getElementById('loginModal')) {
        document.getElementById('loginModal').style.display = 'none';
    }
};


const users = {
    "c3Jr": "c2lzZW1iYWV2",        
    "Y2F2YWxsaQ==": "Y2F2YWxsaTEyMzQ=", 
    "bGFi": "MTIzNA=="               
};

document.getElementById('loginForm').onsubmit = function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    const encodedUsername = btoa(username);
    const encodedPassword = btoa(password);

    if (users[encodedUsername] && users[encodedUsername] === encodedPassword) {
        // Сохраняем авторизацию в sessionStorage
        sessionStorage.setItem('isLoggedIn', 'true');

        document.getElementById('loginModal').style.display = 'none';
        window.location.href = '.lab_dashboard.html';
    } else {
        alert('Неверный логин или пароль');
    }
};