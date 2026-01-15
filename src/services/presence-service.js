import { db, auth } from '../lib/firebase.js'
import { ref, set, onValue, onDisconnect, serverTimestamp, off } from 'firebase/database'

let presenceRef = null
let userPresenceRef = null
let presenceCallback = null

export function setPresenceCallback(callback) {
    presenceCallback = callback
}

export function setupPresence(user) {
    if (!user) return

    // 현재 사용자의 presence 경로
    userPresenceRef = ref(db, `presence/${user.uid}`)

    // 사용자 정보 저장
    const userPresenceData = {
        displayName: user.displayName || '익명',
        email: user.email,
        photoURL: user.photoURL || null,
        lastSeen: serverTimestamp()
    }

    // 접속 시 presence 등록
    set(userPresenceRef, userPresenceData)

    // 연결이 끊어지면 자동으로 삭제
    onDisconnect(userPresenceRef).remove()

    // 전체 접속자 목록 리스닝
    presenceRef = ref(db, 'presence')
    onValue(presenceRef, (snapshot) => {
        const presenceData = snapshot.val() || {}
        const onlineUsers = Object.entries(presenceData).map(([uid, data]) => ({
            uid,
            ...data
        }))

        if (presenceCallback) {
            presenceCallback(onlineUsers)
        }
    })
}

export function removePresence() {
    if (userPresenceRef) {
        set(userPresenceRef, null)
        userPresenceRef = null
    }

    if (presenceRef) {
        off(presenceRef)
        presenceRef = null
    }
}
