/**
 * 登入認證模組
 * Event Management System v3.0.0
 */

// ==================== 管理者登入 ====================
function loginAsAdmin() {
    currentRole = 'admin';
    currentUser = null;

    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('adminScreen').classList.remove('hidden');

    renderAdminScreen();
}

// ==================== 使用者登入 ====================
function loginAsUser() {
    const userId = document.getElementById('userIdInput').value.trim();

    if (!userId) {
        alert('請輸入使用者 ID！');
        return;
    }

    currentRole = 'user';
    currentUser = userId;

    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('userScreen').classList.remove('hidden');
    document.getElementById('currentUserDisplay').textContent = currentUser;

    renderUserScreen();
}

// ==================== 登出 ====================
function logout() {
    currentRole = null;
    currentUser = null;

    document.getElementById('adminScreen').classList.add('hidden');
    document.getElementById('userScreen').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('userIdInput').value = '';
}
