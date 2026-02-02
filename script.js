// Form elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');

// Navigation links
const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');
const showForgotPasswordLink = document.getElementById('showForgotPassword');
const backToLoginLink = document.getElementById('backToLogin');

// Form elements
const loginFormElement = document.getElementById('loginFormElement');
const signupFormElement = document.getElementById('signupFormElement');
const forgotPasswordFormElement = document.getElementById('forgotPasswordFormElement');

// Password toggle elements
const toggleLoginPassword = document.getElementById('toggleLoginPassword');
const toggleSignupPassword = document.getElementById('toggleSignupPassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

// Social login buttons
const googleLoginBtn = document.getElementById('googleLogin');
const facebookLoginBtn = document.getElementById('facebookLogin');
const githubLoginBtn = document.getElementById('githubLogin');
const googleSignupBtn = document.getElementById('googleSignup');
const facebookSignupBtn = document.getElementById('facebookSignup');
const githubSignupBtn = document.getElementById('githubSignup');

// Notification
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');

// Form switching functions
function showForm(formToShow) {
    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    forgotPasswordForm.classList.add('hidden');
    formToShow.classList.remove('hidden');
}

// Event listeners for form switching
showSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    showForm(signupForm);
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showForm(loginForm);
});

showForgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    showForm(forgotPasswordForm);
});

backToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showForm(loginForm);
});

// Password toggle functionality
function togglePasswordVisibility(toggleButton, passwordInput) {
    toggleButton.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        toggleButton.classList.toggle('fa-eye');
        toggleButton.classList.toggle('fa-eye-slash');
    });
}

togglePasswordVisibility(toggleLoginPassword, document.getElementById('loginPassword'));
togglePasswordVisibility(toggleSignupPassword, document.getElementById('signupPassword'));
togglePasswordVisibility(toggleConfirmPassword, document.getElementById('signupConfirmPassword'));

// Notification function
function showNotification(message, isError = false) {
    notificationMessage.textContent = message;
    notification.classList.remove('hidden');
    
    if (isError) {
        notification.classList.add('error');
    } else {
        notification.classList.remove('error');
    }
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Password validation
function isValidPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
}

// Login form submission
loginFormElement.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', true);
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', true);
        return;
    }
    
    // Simulate login
    console.log('Login attempt:', { email, password, rememberMe });
    
    // Store login state
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', email.split('@')[0]);
    
    showNotification('Login successful! Redirecting...');
    
    // Redirect to dashboard
    setTimeout(() => {
        window.location.href = "Dashboard/dashboard.html";
    }, 1500);
});

// Signup form submission
signupFormElement.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    if (!name || name.trim().length < 2) {
        showNotification('Please enter your full name', true);
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', true);
        return;
    }
    
    if (!isValidPassword(password)) {
        showNotification('Password must be at least 8 characters with uppercase, lowercase, and number', true);
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', true);
        return;
    }
    
    if (!agreeTerms) {
        showNotification('Please agree to the Terms & Conditions', true);
        return;
    }
    
    // Simulate signup
    console.log('Signup attempt:', { name, email, password });
    
    // Store login state
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', name);
    
    showNotification('Account created successfully! Redirecting...');
    
    // Redirect to dashboard
    setTimeout(() => {
        window.location.href = "Dashboard/dashboard.html";
    }, 1500);
});

// Forgot password form submission
forgotPasswordFormElement.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value;
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', true);
        return;
    }
    
    // Simulate password reset
    console.log('Password reset requested for:', email);
    showNotification('Password reset link sent to your email!');
    
    // Reset form and switch to login
    setTimeout(() => {
        forgotPasswordFormElement.reset();
        showForm(loginForm);
    }, 2000);
});

// Social login handlers
function handleSocialLogin(provider) {
    console.log(`${provider} login initiated`);
    showNotification(`Connecting to ${provider}...`);
    
    // Simulate OAuth flow
    setTimeout(() => {
        showNotification(`${provider} login successful!`);
    }, 1500);
}

googleLoginBtn.addEventListener('click', () => handleSocialLogin('Google'));
facebookLoginBtn.addEventListener('click', () => handleSocialLogin('Facebook'));
githubLoginBtn.addEventListener('click', () => handleSocialLogin('GitHub'));
googleSignupBtn.addEventListener('click', () => handleSocialLogin('Google'));
facebookSignupBtn.addEventListener('click', () => handleSocialLogin('Facebook'));
githubSignupBtn.addEventListener('click', () => handleSocialLogin('GitHub'));

// Input animations (add focus effects)
const inputs = document.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]');

inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'translateY(-2px)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'translateY(0)';
    });
});

// Prevent form submission on Enter in password fields (optional enhancement)
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.type !== 'submit') {
            const form = input.closest('form');
            if (form) {
                // Find submit button and click it
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    e.preventDefault();
                    submitBtn.click();
                }
            }
        }
    });
});

// Add smooth transitions when switching forms
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const target = mutation.target;
            if (!target.classList.contains('hidden')) {
                target.style.animation = 'fadeIn 0.4s ease';
            }
        }
    });
});

// Observe all form contents
[loginForm, signupForm, forgotPasswordForm].forEach(form => {
    observer.observe(form, { attributes: true });
});

// Add fadeIn animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

console.log('Login page initialized successfully!');
