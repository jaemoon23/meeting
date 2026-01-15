import { auth, googleProvider } from '../lib/firebase.js'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { isEmailAllowed } from '../config/allowed-emails.js'

let currentUser = null
let authStateCallback = null

export function getCurrentUser() {
    return currentUser
}

export function setAuthStateCallback(callback) {
    authStateCallback = callback
}

export function initAuthListener() {
    onAuthStateChanged(auth, async (user) => {
        if (user && !isEmailAllowed(user.email)) {
            // 허용되지 않은 이메일이면 로그아웃
            await signOut(auth)
            alert('접근 권한이 없습니다. 관리자에게 문의하세요.')
            currentUser = null
            if (authStateCallback) {
                authStateCallback(null)
            }
            return
        }

        currentUser = user
        if (authStateCallback) {
            authStateCallback(user)
        }
    })
}

export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider)
        return result.user
    } catch (error) {
        console.error('로그인 실패:', error)
        throw error
    }
}

export async function logout() {
    try {
        await signOut(auth)
    } catch (error) {
        console.error('로그아웃 실패:', error)
        throw error
    }
}
