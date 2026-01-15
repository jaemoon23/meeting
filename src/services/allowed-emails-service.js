import { db } from '../lib/firebase.js'
import { ref, onValue, off, set, remove, get } from 'firebase/database'

let allowedEmailsRef = null
let allowedEmails = []
let allowedEmailsCallback = null

// 허용된 이메일 목록 리스너 설정
export function setupAllowedEmailsListener() {
    allowedEmailsRef = ref(db, 'allowedEmails')
    onValue(allowedEmailsRef, (snapshot) => {
        const data = snapshot.val() || {}
        allowedEmails = Object.values(data).map(item => item.email?.toLowerCase())
        if (allowedEmailsCallback) {
            allowedEmailsCallback(allowedEmails)
        }
    })
}

// 리스너 제거
export function removeAllowedEmailsListener() {
    if (allowedEmailsRef) {
        off(allowedEmailsRef)
        allowedEmailsRef = null
    }
}

// 콜백 설정
export function setAllowedEmailsCallback(callback) {
    allowedEmailsCallback = callback
}

// 허용된 이메일 목록 반환
export function getAllowedEmails() {
    return allowedEmails
}

// 이메일이 허용되었는지 확인
export function isEmailAllowed(email) {
    if (!email) return false
    return allowedEmails.includes(email.toLowerCase())
}

// 이메일이 허용되었는지 확인 (비동기 - 초기 로드용)
export async function checkEmailAllowed(email) {
    if (!email) return false

    const snapshot = await get(ref(db, 'allowedEmails'))
    const data = snapshot.val() || {}
    const emails = Object.values(data).map(item => item.email?.toLowerCase())
    return emails.includes(email.toLowerCase())
}

// 이메일 추가 (관리자 전용)
export async function addAllowedEmail(email) {
    if (!email) throw new Error('이메일이 필요합니다.')

    const normalizedEmail = email.toLowerCase().trim()
    const key = normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_')

    await set(ref(db, `allowedEmails/${key}`), {
        email: normalizedEmail,
        addedAt: Date.now()
    })
}

// 이메일 삭제 (관리자 전용)
export async function removeAllowedEmail(email) {
    if (!email) throw new Error('이메일이 필요합니다.')

    const normalizedEmail = email.toLowerCase().trim()
    const key = normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_')

    await remove(ref(db, `allowedEmails/${key}`))
}
