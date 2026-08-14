// auth.js
let currentUser = null;

async function checkAuth() {
    try {
        const response = await fetch('${API_BASE}/auth.php?action=check');
        const data = await response.json();
        if (data.authentication) {
            currentUser = data;
        } else {
            currentUser = null;
        }   
    }  catch (err) {
        console.error("Auth check failed", err);
    } 
    
}

async function logout() {
    try {
        await fetch(`${API_BASE}/auth.php?action=logout`, { method: 'POST' });
        window.location.href = 'index.html';
    } catch (err) {
        console.error("Logout failed", err);
    }
}

function setupLoginForm() {
    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const res = await fetch(`${API_BASE}/auth.php?action=login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await res.json();
                if (res.ok) {
                    window.location.href = 'index.html';
                } else {
                    showAlert(result.error);
                }
            } catch (err) {
                showAlert('Login failed. Please try again.');
            }
        });
    }
}

function setupRegisterForm() {
    const form = document.getElementById('register-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const res = await fetch(`${API_BASE}/auth.php?action=register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await res.json();
                if (res.ok) {
                    showAlert('Registration successful. You can now login.', 'success');
                    setTimeout(() => window.location.href = 'login.html', 1500);
                } else {
                    showAlert(result.error);
                }
            } catch (err) {
                showAlert('Registration failed. Please try again.');
            }
        });
    }
}