document.addEventListener('DOMContentLoaded', () => {
    // Hamburger Menu Functionality
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.getElementById('mainNav');

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    // Modal Handling
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const closeButtons = document.querySelectorAll('.modal .close-button');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const addRecipeLink = document.getElementById('addRecipeLink');
    const privateCollectionLink = document.getElementById('privateCollectionLink');
    const favoritesLink = document.getElementById('favoritesLink');
    const userGreeting = document.getElementById('userGreeting');
    const usernameSpan = document.getElementById('username');

    const showModal = (modal) => {
        modal.classList.add('show-modal');
        document.body.style.overflow = 'hidden';
    };

    const hideModal = (modal) => {
        modal.classList.remove('show-modal');
        document.body.style.overflow = '';
    };

    if (loginBtn) {
        loginBtn.addEventListener('click', () => showModal(loginModal));
    }
    if (signupBtn) {
        signupBtn.addEventListener('click', () => showModal(signupModal));
    }

    closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            hideModal(e.target.closest('.modal'));
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            hideModal(loginModal);
        }
        if (event.target === signupModal) {
            hideModal(signupModal);
        }
    });

    const checkUserState = () => {
        const loggedInUser = localStorage.getItem('loggedInUser');
        if (loggedInUser) {
            loginBtn.classList.add('hide');
            signupBtn.classList.add('hide');
            logoutBtn.classList.remove('hide');
            addRecipeLink.classList.remove('hide');
            privateCollectionLink.classList.remove('hide');
            favoritesLink.classList.remove('hide');
            userGreeting.classList.remove('hide');
            usernameSpan.textContent = loggedInUser;
        } else {
            loginBtn.classList.remove('hide');
            signupBtn.classList.remove('hide');
            logoutBtn.classList.add('hide');
            addRecipeLink.classList.add('hide');
            privateCollectionLink.classList.add('hide');
            favoritesLink.classList.add('hide');
            userGreeting.classList.add('hide');
        }
    };

    // User authentication functions
    const registerUser = (username, password) => {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userExists = users.some(user => user.username === username);
        if (userExists) {
            return false;
        }
        users.push({ username, password });
        localStorage.setItem('users', JSON.stringify(users));
        return true;
    };

    const authenticateUser = (username, password) => {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(user => user.username === username && user.password === password);
        return !!user;
    };

    // Form submission handlers
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = e.target.signupUsername.value;
        const password = e.target.signupPassword.value;
        if (registerUser(username, password)) {
            window.showNotification('Registration successful! Please log in.', 'success');
            hideModal(signupModal);
            showModal(loginModal);
            checkUserState();
        } else {
            window.showNotification('Username already exists.', 'error');
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = e.target.loginUsername.value;
        const password = e.target.loginPassword.value;
        if (authenticateUser(username, password)) {
            localStorage.setItem('loggedInUser', username);
            window.showNotification('Login successful!', 'success');
            hideModal(loginModal);
            checkUserState();
            window.location.href = 'recipes.html';
        } else {
            window.showNotification('Invalid username or password.', 'error');
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('loggedInUser');
            window.showNotification('Logged out successfully!', 'info');
            checkUserState();
            window.location.href = 'index.html';
        });
    }

    // Notification system
    window.showNotification = (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => notification.remove());
        }, 3000);
    };

    checkUserState();
});
