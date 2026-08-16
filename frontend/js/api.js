// api.js
const API_BASE = '../backend';

function showAlert(message, type = 'error') {
    const alertBox = document.getElementById('alert');
    if (alertBox) {
        alertBox.textContent = message;
        alertBox.className = `alert ${type}`;
        alertBox.style.display = 'block';
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}
