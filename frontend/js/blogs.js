// blogs.js
// Home Page Blogs
async function loadBlogs(category = 'All') {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;
    
    try {
        grid.innerHTML = '<div class="loader active">Loading blogs...</div>';
        const url = category === 'All' ? `${API_BASE}/blogs.php?action=get-all` : `${API_BASE}/blogs.php?action=get-all&category=${encodeURIComponent(category)}`;
        const res = await fetch(url);
        
        let blogs;
        try {
            blogs = await res.json();
        } catch (e) {
            throw new Error("Failed to parse response. Are you running this through a PHP server like XAMPP?");
        }

        if (!res.ok) {
            throw new Error(blogs.error || 'Unknown server error');
        }
        
        if (blogs.length === 0) {
            grid.innerHTML = '<p>No blogs found in this category.</p>';
            return;
        }
        
        renderBlogCards(grid, blogs, false);
    } catch (err) {
        grid.innerHTML = `<p class="alert error">Failed to load blogs. Reason: ${err.message}</p>`;
        console.error(err);
    }
}

function setupCategoryFilters() {
    const filters = document.querySelectorAll('.filter-btn');
    filters.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filters.forEach(f => {
                f.classList.remove('btn-primary', 'active');
                f.classList.add('btn-outline');
            });
            const clicked = e.target;
            clicked.classList.remove('btn-outline');
            clicked.classList.add('btn-primary', 'active');
            
            loadBlogs(clicked.dataset.category);
        });
    });
}

async function loadMyBlogs() {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    const container = document.getElementById('my-blogs-container');
    if (!container) return;
    
    try {
        container.innerHTML = '<div class="loader active">Loading your blogs...</div>';
        const res = await fetch(`${API_BASE}/blogs.php?action=get-all&author=me`);
        const blogs = await res.json();
        
        if (res.ok) {
            if (blogs.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center; padding: 4rem 0;">
                        <p style="color: var(--text-muted); margin-bottom: 1rem;">You haven't written any blogs yet.</p>
                        <a href="editor.html" class="btn btn-primary">+ Write New Post</a>
                    </div>
                `;
            } else {
                renderBlogCards(container, blogs, true);
            }
        } else {
            container.innerHTML = `<p class="alert error">${blogs.error}</p>`;
        }
    } catch (err) {
        container.innerHTML = '<p class="alert error">Failed to load your blogs.</p>';
    }
}

function renderBlogCards(container, blogs, showActions = false) {
    let html = '';
    
    blogs.forEach(blog => {
        const likeClass = blog.has_liked ? 'liked' : '';
        const likesCount = blog.likes_count > 1000 ? (blog.likes_count/1000).toFixed(1) + 'k' : (blog.likes_count || 0);
        
        const imgId = (blog.id % 10) + 10; 
        const displayImg = blog.image_url ? `../${blog.image_url}` : `https://picsum.photos/id/${imgId}/600/400`;
        const avatarImg = `https://i.pravatar.cc/100?u=${blog.user_id}`;
        const category = blog.category || 'General';
        
        const contentLen = blog.content ? blog.content.length : (blog.excerpt ? blog.excerpt.length * 8 : 1500);
        const readTime = Math.max(3, Math.floor(contentLen / 500));
        
        let actionsHtml = '';
        if (showActions && typeof currentUser !== 'undefined' && currentUser && currentUser.user_id == blog.user_id) {
            actionsHtml = `
                <div class="my-blog-actions" style="margin-left: auto;">
                    <a href="editor.html?id=${blog.id}" class="icon-btn edit" title="Edit">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </a>
                    <button class="icon-btn delete" onclick="deleteBlog(${blog.id})" title="Delete">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
        }
        
        html += `
            <div class="blog-card">
                <img src="${displayImg}" alt="Blog Image" class="blog-card-img">
                <div class="blog-card-content">
                    <span class="blog-category">${category}</span>
                    <h3><a href="blog.html?id=${blog.id}">${blog.title}</a></h3>
                    <p class="blog-excerpt">${blog.excerpt || (blog.content ? blog.content.substring(0, 150) + '...' : '')}</p>
                    
                    <div class="blog-meta-footer">
                        <div class="author-info">
                            <img src="${avatarImg}" alt="${blog.username}" class="author-avatar">
                            <div class="author-details">
                                <span class="author-name">${blog.username}</span>
                                <span class="post-date">${new Date(blog.created_at).toLocaleDateString()} &bull; ${readTime} min read</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <button class="like-btn ${likeClass}" onclick="toggleLike(${blog.id}, this)">
                                <svg viewBox="0 0 24 24">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                                <span class="like-count">${likesCount}</span>
                            </button>
                            ${actionsHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function toggleLike(blogId, btnElement) {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/blogs.php?action=toggle-like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toggle_like: true, blog_id: blogId })
        });
        
        if (res.ok) {
            const data = await res.json();
            const countSpan = btnElement.querySelector('.like-count');
            let currentCount = parseInt(countSpan.textContent) || 0;
            
            if (data.liked) {
                btnElement.classList.add('liked');
                countSpan.textContent = currentCount + 1;
            } else {
                btnElement.classList.remove('liked');
                countSpan.textContent = Math.max(0, currentCount - 1);
            }
        }
    } catch (err) {
        console.error("Like failed", err);
    }
}

async function loadSingleBlog() {
    const container = document.getElementById('single-blog');
    if (!container) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (!id) {
        container.innerHTML = '<p class="alert error">Blog ID not found.</p>';
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/blogs.php?action=get-one&id=${id}`);
        if (!res.ok) throw new Error('Blog not found');
        const blog = await res.json();
        
        const date = new Date(blog.created_at).toLocaleDateString();
        let actionsHtml = '';
        
        if (currentUser && currentUser.user_id == blog.user_id) {
            actionsHtml = `
                <div class="blog-actions">
                    <a href="editor.html?id=${blog.id}" class="btn btn-outline">Edit</a>
                    <button onclick="deleteBlog(${blog.id})" class="btn btn-danger">Delete</button>
                </div>
            `;
        }
        
        const likeClass = blog.has_liked ? 'liked' : '';
        const likesCount = blog.likes_count || 0;
        
        const parsedContent = typeof marked !== 'undefined' ? marked.parse(blog.content) : blog.content;
        
        const imgId = (blog.id % 10) + 10; 
        const displayImg = blog.image_url ? `../${blog.image_url}` : `https://picsum.photos/id/${imgId}/1200/600`;
        
        container.innerHTML = `
            <div class="single-blog-header">
                <h1 class="single-blog-title">${blog.title}</h1>
                <div class="single-blog-meta">
                    <span>By ${blog.username} &bull; ${date}</span>
                    <div style="display:flex; align-items:center; gap: 1rem;">
                        <button class="like-btn ${likeClass}" onclick="toggleLike(${blog.id}, this)">
                            <svg viewBox="0 0 24 24">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span class="like-count">${likesCount}</span>
                        </button>
                        ${actionsHtml}
                    </div>
                </div>
            </div>
            <img src="${displayImg}" alt="Blog Cover" style="width: 100%; max-height: 500px; object-fit: cover; border-radius: 8px; margin-bottom: 3rem;">
            <div class="blog-content">
                ${parsedContent}
            </div>
        `;
    } catch (err) {
        container.innerHTML = '<p class="alert error">Failed to load blog post.</p>';
    }
}

async function deleteBlog(id) {
    if (!confirm("Are you sure you want to delete this blog?")) return;
    
    try {
        const res = await fetch(`${API_BASE}/blogs.php?action=delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        
        if (res.ok) {
            window.location.reload();
        } else {
            const data = await res.json();
            showAlert(data.error);
        }
    } catch (err) {
        showAlert('Failed to delete blog.');
    }
}
