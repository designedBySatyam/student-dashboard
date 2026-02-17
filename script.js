'use strict';
const $ = id => document.getElementById(id);

/* Toast */
const toastEl = $('toast'); let _tt;
function toast(msg, type = 'success') {
    clearTimeout(_tt); $('toastMsg').textContent = msg;
    toastEl.className = `toast ${type} show`;
    _tt = setTimeout(() => toastEl.classList.remove('show'), 3200);
}

/* Validation */
const isEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const strongPw = p => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(p);

/* Form switching */
const lF = $('loginForm'), sF = $('signupForm'), fF = $('forgotForm');
const show = f => [lF, sF, fF].forEach(x => x.classList.toggle('hidden', x !== f));
$('toSignup').onclick = e => { e.preventDefault(); show(sF); };
$('toLogin').onclick = e => { e.preventDefault(); show(lF); };
$('toForgot').onclick = e => { e.preventDefault(); show(fF); };
$('backLogin').onclick = e => { e.preventDefault(); show(lF); };

/* Eye toggles */
function eye(btnId, inpId) {
    $(btnId).onclick = () => {
        const i = $(inpId); i.type = i.type === 'password' ? 'text' : 'password';
        $(btnId).textContent = i.type === 'password' ? '👁' : '🙈';
    };
}
eye('eyeLogin', 'loginPw'); eye('eyeSignup', 'signupPw'); eye('eyeConfirm', 'signupCpw');

/* Login */
$('loginEl').onsubmit = e => {
    e.preventDefault();
    const em = $('loginEmail').value.trim(), pw = $('loginPw').value;
    if (!isEmail(em)) return toast('Please enter a valid email address.', 'error');
    if (pw.length < 6) return toast('Password must be at least 6 characters.', 'error');
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', em);
    localStorage.setItem('userName', em.split('@')[0]);
    toast('Welcome back! Redirecting…', 'success');
    setTimeout(() => { window.location.href = '../Dashboard/dashboard.html'; }, 1400);
};

/* Signup */
$('signupEl').onsubmit = e => {
    e.preventDefault();
    const n = $('signupName').value.trim(), em = $('signupEmail').value.trim(),
        pw = $('signupPw').value, cpw = $('signupCpw').value, t = $('terms').checked;
    if (!n || n.length < 2) return toast('Please enter your full name.', 'error');
    if (!isEmail(em)) return toast('Please enter a valid email.', 'error');
    if (!strongPw(pw)) return toast('Password needs 8+ chars, uppercase, lowercase & number.', 'error');
    if (pw !== cpw) return toast('Passwords do not match.', 'error');
    if (!t) return toast('Please agree to the Terms & Conditions.', 'error');
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', em);
    localStorage.setItem('userName', n);
    toast('Account created! Redirecting…', 'success');
    setTimeout(() => { window.location.href = '../Dashboard/dashboard.html'; }, 1400);
};

/* Forgot */
$('forgotEl').onsubmit = e => {
    e.preventDefault();
    if (!isEmail($('resetEmail').value.trim())) return toast('Please enter a valid email.', 'error');
    toast('Reset link sent to your email!', 'success');
    setTimeout(() => { $('forgotEl').reset(); show(lF); }, 2000);
};

/* Field lift */
document.querySelectorAll('.iw input').forEach(i => {
    i.addEventListener('focus', () => i.closest('.field').style.transform = 'translateY(-1px)');
    i.addEventListener('blur', () => i.closest('.field').style.transform = '');
});