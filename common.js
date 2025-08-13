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
            if (addRecipeLink) addRecipeLink.classList.remove('hide');
            if (privateCollectionLink) privateCollectionLink.classList.remove('hide');
            if (favoritesLink) favoritesLink.classList.remove('hide');
            if (userGreeting) userGreeting.classList.remove('hide');
            if (usernameSpan) usernameSpan.textContent = loggedInUser;
        } else {
            loginBtn.classList.remove('hide');
            signupBtn.classList.remove('hide');
            logoutBtn.classList.add('hide');
            if (addRecipeLink) addRecipeLink.classList.add('hide');
            if (privateCollectionLink) privateCollectionLink.classList.add('hide');
            if (favoritesLink) favoritesLink.classList.add('hide');
            if (userGreeting) userGreeting.classList.add('hide');
        }
    };

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

    document.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (e.target.id === 'signupForm') {
            const username = e.target.signupUsername.value;
            const password = e.target.signupPassword.value;
            if (registerUser(username, password)) {
                window.showNotification('Registration successful! Please log in.', 'success');
                hideModal(signupModal);
                showModal(loginModal);
            } else {
                window.showNotification('Username already exists.', 'error');
            }
        }

        if (e.target.id === 'loginForm') {
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
        const container = document.getElementById('notificationContainer');
        if (!container) {
            console.error('Notification container not found!');
            return;
        }
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        container.appendChild(notification);
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
