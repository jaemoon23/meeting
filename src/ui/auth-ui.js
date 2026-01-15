import { loginWithGoogle, logout } from '../services/auth-service.js'
import { isAdmin } from '../config/admin.js'

export function showAuthScreen() {
    document.getElementById('authContainer').style.display = 'flex'
    document.getElementById('appContainer').classList.add('app-hidden')
}

export function showAppScreen(user) {
    document.getElementById('authContainer').style.display = 'none'
    document.getElementById('appContainer').classList.remove('app-hidden')

    if (user) {
        document.getElementById('userAvatar').src = user.photoURL || ''
        document.getElementById('userName').textContent = user.displayName || user.email

        // 관리자 버튼 표시/숨김
        const adminBtn = document.getElementById('adminBtn')
        if (adminBtn) {
            adminBtn.style.display = isAdmin(user.email) ? 'inline-flex' : 'none'
        }
    }
}

export function setupAuthUI(onLoginSuccess) {
    const googleLoginBtn = document.getElementById('googleLoginBtn')
    const logoutBtn = document.getElementById('logoutBtn')

    googleLoginBtn.addEventListener('click', async () => {
        try {
            googleLoginBtn.disabled = true
            googleLoginBtn.textContent = '로그인 중...'
            await loginWithGoogle()
            if (onLoginSuccess) onLoginSuccess()
        } catch (error) {
            alert('로그인에 실패했습니다. 다시 시도해주세요.')
        } finally {
            googleLoginBtn.disabled = false
            googleLoginBtn.innerHTML = `
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">
                <span>Google로 로그인</span>
            `
        }
    })

    logoutBtn.addEventListener('click', async () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            await logout()
        }
    })
}
