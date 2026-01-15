import { db } from '../lib/firebase.js'
import { ref, set, onValue, off, get } from 'firebase/database'
import { getCurrentUser } from './auth-service.js'
import { getAllowedEmails } from './allowed-emails-service.js'

let discordMappingRef = null
let discordMappings = {}
let mappingCallback = null

export function setDiscordMappingCallback(callback) {
    mappingCallback = callback
}

export function getDiscordMappings() {
    return discordMappings
}

export function getDiscordIdByEmail(email) {
    const mapping = Object.values(discordMappings).find(m => m.email === email)
    return mapping?.discordId || null
}

export function getDiscordIdByUid(uid) {
    return discordMappings[uid]?.discordId || null
}

export function setupDiscordMappingListener() {
    const user = getCurrentUser()
    if (!user) return

    discordMappingRef = ref(db, 'discordMapping')
    onValue(discordMappingRef, (snapshot) => {
        const data = snapshot.val()
        discordMappings = data || {}

        if (mappingCallback) {
            mappingCallback(discordMappings)
        }
    })
}

export function removeDiscordMappingListener() {
    if (discordMappingRef) {
        off(discordMappingRef)
        discordMappingRef = null
    }
    discordMappings = {}
}

// 내 Discord ID 저장
export async function saveMyDiscordId(discordId, discordName = '') {
    const user = getCurrentUser()
    if (!user) return false

    const mappingRef = ref(db, `discordMapping/${user.uid}`)
    await set(mappingRef, {
        email: user.email,
        displayName: user.displayName || '',
        discordId: discordId.trim(),
        discordName: discordName.trim(),
        updatedAt: Date.now()
    })

    return true
}

// 관리자: 다른 사람 Discord ID 저장
export async function saveDiscordIdForUser(uid, email, displayName, discordId, discordName = '') {
    const mappingRef = ref(db, `discordMapping/${uid}`)
    await set(mappingRef, {
        email,
        displayName,
        discordId: discordId.trim(),
        discordName: discordName.trim(),
        updatedAt: Date.now()
    })

    return true
}

// 등록되지 않은 사용자 목록 가져오기 (관리자용)
export function getUnregisteredUsers() {
    const allowedEmails = getAllowedEmails()
    const registeredEmails = Object.values(discordMappings).map(m => m.email)
    return allowedEmails.filter(email => !registeredEmails.includes(email))
}

// 모든 사용자 목록 가져오기 (관리자용)
export function getAllUsersWithMapping() {
    const allowedEmails = getAllowedEmails()
    const result = []

    // 등록된 사용자
    for (const [uid, mapping] of Object.entries(discordMappings)) {
        result.push({
            uid,
            email: mapping.email,
            displayName: mapping.displayName || '',
            discordId: mapping.discordId || '',
            discordName: mapping.discordName || '',
            isRegistered: !!mapping.discordId
        })
    }

    // 미등록 사용자 (allowedEmails에는 있지만 mapping이 없는)
    const registeredEmails = result.map(u => u.email)
    for (const email of allowedEmails) {
        if (!registeredEmails.includes(email)) {
            result.push({
                uid: null,
                email,
                displayName: '',
                discordId: '',
                discordName: '',
                isRegistered: false
            })
        }
    }

    return result
}
