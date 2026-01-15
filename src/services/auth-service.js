import { auth, googleProvider } from '../lib/firebase.js'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'

let currentUser = null
let authStateCallback = null

export function getCurrentUser() {
    return currentUser
}

export function setAuthStateCallback(callback) {
    authStateCallback = callback
}

export function initAuthListener() {
    onAuthStateChanged(auth, (user) => {
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
