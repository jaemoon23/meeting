import { db } from '../lib/firebase.js'
import { ref, onValue, off } from 'firebase/database'
import { getCurrentUser } from './auth-service.js'

const OWNER_EMAIL = '990914s@gmail.com'

let adminConfigRef = null
let adminConfig = {}
let permissionCallback = null

export function setPermissionCallback(callback) {
    permissionCallback = callback
}

export function setupPermissionListener() {
    adminConfigRef = ref(db, 'adminConfig')
    onValue(adminConfigRef, (snapshot) => {
        adminConfig = snapshot.val() || {}
        if (permissionCallback) {
            permissionCallback(adminConfig)
        }
    })
}

export function removePermissionListener() {
    if (adminConfigRef) {
        off(adminConfigRef)
        adminConfigRef = null
    }
    adminConfig = {}
}

// Owner인지 확인
export function isOwner(email = null) {
    if (!email) {
        const user = getCurrentUser()
        email = user?.email
    }
    return email?.toLowerCase() === OWNER_EMAIL.toLowerCase()
}

// 특정 권한이 있는지 확인
export function hasPermission(permission, email = null) {
    if (!email) {
        const user = getCurrentUser()
        email = user?.email
    }

    if (!email) return false

    // Owner는 모든 권한 보유
    if (isOwner(email)) return true

    // adminConfig에서 해당 사용자의 권한 확인
    const admins = adminConfig.admins || {}
    const userAdmin = Object.values(admins).find(a => a.email?.toLowerCase() === email.toLowerCase())

    if (!userAdmin) return false

    return userAdmin.permissions?.includes(permission) || false
}

// 사용자 관리 권한
export function canManageUsers(email = null) {
    return hasPermission('canManageUsers', email)
}

// Discord 관리 권한 (다른 사람 Discord ID 관리)
export function canManageDiscord(email = null) {
    return hasPermission('canManageDiscord', email)
}

// 템플릿 관리 권한
export function canManageTemplates(email = null) {
    return hasPermission('canManageTemplates', email)
}

// 회의록 삭제 권한
export function canDeleteMeetings(email = null) {
    return hasPermission('canDeleteMeetings', email)
}

// 자기 자신의 데이터인지 확인
export function isOwnData(targetUid) {
    const user = getCurrentUser()
    return user?.uid === targetUid
}

// 자기 자신의 이메일인지 확인
export function isOwnEmail(targetEmail) {
    const user = getCurrentUser()
    return user?.email?.toLowerCase() === targetEmail?.toLowerCase()
}
