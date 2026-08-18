// main.js
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    
    // Setup generic UI handlers
    setupNavbar();
    
    // Page specific initialization
    const path = window.location.pathname;
    
    if (path.endsWith('login.html')) {
        setupLoginForm();
    } else if (path.endsWith('register.html')) {
        setupRegisterForm();
    } else if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) {
        loadBlogs();
        setupCategoryFilters();
    } else if (path.endsWith('my-blogs.html')) {
        loadMyBlogs();
    } else if (path.endsWith('blog.html')) {
        loadSingleBlog();
    } else if (path.endsWith('editor.html')) {
        setupEditor();
    }
});

function setupNavbar() {
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) return;
    
    const path = window.location.pathname;
    const isHome = path.endsWith('index.html') || path === '/' || path.endsWith('/');
    const isMyBlogs = path.endsWith('my-blogs.html');
    const isAbout = path.endsWith('about.html');
    
    let centerLinks = `
        <a href="index.html" class="${isHome ? 'active' : ''}">Home</a>
        <a href="my-blogs.html" class="${isMyBlogs ? 'active' : ''}" style="${currentUser ? '' : 'display:none;'}">My Blogs</a>
        <a href="about.html" class="${isAbout ? 'active' : ''}">About</a>
    `;

    let rightActions = '';
    if (currentUser) {
        const userAvatar = `https://i.pravatar.cc/100?u=${currentUser.user_id}`;
        rightActions = `
            <div style="display: flex; align-items: center; gap: 0.8rem;">
                <img src="${userAvatar}" alt="${currentUser.username}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color);">
                <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-main);">${currentUser.username}</span>
                <button onclick="logout()" class="btn btn-outline" style="padding: 0.4rem 0.8rem; margin-left: 0.5rem; font-size: 0.85rem;">Logout</button>
            </div>
        `;
    } else {
        rightActions = `
            <a href="login.html" style="color: var(--text-main); text-decoration: none; font-weight: 500; font-size: 0.95rem;">Login</a>
            <a href="register.html" class="btn btn-primary">Sign Up</a>
        `;
    }
    
    navLinks.innerHTML = `
        <div class="nav-center-links">${centerLinks}</div>
        <div class="header-actions">${rightActions}</div>
    `;
}
