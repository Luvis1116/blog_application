// editor.js
async function setupEditor() {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const form = document.getElementById('editor-form');
    
    if (id) {
        document.getElementById('editor-page-title').textContent = 'Edit Blog Post';
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) submitBtn.textContent = 'Update Post';
        try {
            const res = await fetch(`${API_BASE}/blogs.php?action=get-one&id=${id}`);
            const blog = await res.json();
            
            if (blog.user_id != currentUser.user_id) {
                showAlert('You are not authorized to edit this blog.');
                if(form) form.style.display = 'none';
                return;
            }
            document.getElementById('title').value = blog.title;
            if(document.getElementById('category')) document.getElementById('category').value = blog.category || 'General';
            document.getElementById('content').value = blog.content;
            
            if (blog.image_url) {
                document.getElementById('current-image-preview').style.display = 'block';
                document.getElementById('preview-img').src = `../${blog.image_url}`;
            }
        } catch (err) {
            showAlert('Failed to load blog for editing.');
        }
    }
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            if (id) {
                formData.append('id', id);
            }
            
            const endpoint = id ? `${API_BASE}/blogs.php?action=update` : `${API_BASE}/blogs.php?action=create`;
            
            try {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    body: formData
                });
                
                const result = await res.json();
                if (res.ok) {
                    window.location.href = id ? `blog.html?id=${id}` : 'my-blogs.html';
                } else {
                    showAlert(result.error || 'Failed to save blog post.');
                }
            } catch (err) {
                showAlert('Failed to save blog post. Network error.');
                console.error(err);
            }
        });
    }
}
