import './styles/admin.css'

import { initAuthListener, setAuthStateCallback, getCurrentUser, logout } from './services/auth-service.js'
import { isAdmin } from './config/admin.js'
import {
    setupAllowedEmailsListener,
    removeAllowedEmailsListener,
    setAllowedEmailsCallback,
    getAllowedEmails,
    addAllowedEmail,
    removeAllowedEmail
} from './services/allowed-emails-service.js'
import {
    setupDiscordMappingListener,
    removeDiscordMappingListener,
    setDiscordMappingCallback,
    saveDiscordIdForUser,
    saveMyDiscordId,
    getAllUsersWithMapping
} from './services/discord-mapping-service.js'
import {
    setupPermissionListener,
    removePermissionListener,
    setPermissionCallback,
    isOwner,
    canManageUsers,
    canManageDiscord,
    isOwnEmail
} from './services/permission-service.js'
import { db } from './lib/firebase.js'
import { ref, set, onValue, off } from 'firebase/database'
import { sendTestMessage } from './services/discord-webhook-service.js'

let currentSection = 'discord' // 기본 섹션을 discord로 변경 (모든 사용자 접근 가능)
let adminConfigRef = null
let adminConfig = {}

// 관리자 설정 리스너
function setupAdminConfigListener() {
    adminConfigRef = ref(db, 'adminConfig')
    onValue(adminConfigRef, (snapshot) => {
        adminConfig = snapshot.val() || {}
        renderCurrentSection()
    })
}

function removeAdminConfigListener() {
    if (adminConfigRef) {
        off(adminConfigRef)
        adminConfigRef = null
    }
}

// 로딩 표시
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex'
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none'
}

// 접근 거부 화면
function showAccessDenied() {
    hideLoading()
    document.getElementById('accessDenied').style.display = 'flex'
    document.getElementById('adminContainer').style.display = 'none'
}

// 관리자 화면 표시
function showAdminScreen(user) {
    hideLoading()
    document.getElementById('accessDenied').style.display = 'none'
    document.getElementById('adminContainer').style.display = 'block'

    // 사용자 정보 표시
    document.getElementById('userAvatar').src = user.photoURL || ''
    document.getElementById('userName').textContent = user.displayName || user.email

    // 권한에 따라 네비게이션 메뉴 표시/숨김
    updateNavigationVisibility()
}

// 권한에 따라 네비게이션 메뉴 표시/숨김
function updateNavigationVisibility() {
    const navItems = document.querySelectorAll('.admin-nav-item')

    navItems.forEach(item => {
        const section = item.dataset.section

        switch (section) {
            case 'users':
                // 사용자 관리: canManageUsers 또는 Owner
                item.style.display = canManageUsers() ? 'flex' : 'none'
                break
            case 'permissions':
                // 권한 관리: Owner만
                item.style.display = isOwner() ? 'flex' : 'none'
                break
            case 'discord':
                // Discord 설정: 모든 인증된 사용자 (자기 자신 설정은 가능)
                item.style.display = 'flex'
                break
            case 'settings':
                // 설정: Owner만
                item.style.display = isOwner() ? 'flex' : 'none'
                break
        }
    })

    // 현재 섹션이 접근 불가능하면 discord 섹션으로 이동
    const currentNavItem = document.querySelector(`.admin-nav-item[data-section="${currentSection}"]`)
    if (currentNavItem && currentNavItem.style.display === 'none') {
        switchSection('discord')
    }
}

// 섹션 전환
function switchSection(section) {
    currentSection = section

    // 네비게이션 활성화 상태 변경
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section)
    })

    // 섹션 표시/숨김
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.style.display = sec.id === `section-${section}` ? 'block' : 'none'
    })

    renderCurrentSection()
}

function renderCurrentSection() {
    switch (currentSection) {
        case 'users':
            renderUserList()
            break
        case 'permissions':
            renderPermissionList()
            break
        case 'discord':
            renderDiscordSection()
            break
        case 'settings':
            // 정적 콘텐츠
            break
    }
}

// 사용자 목록 렌더링
function renderUserList() {
    const container = document.getElementById('userList')
    const currentUser = getCurrentUser()
    const allowedEmails = getAllowedEmails()

    let html = '<div class="list-header">등록된 사용자 (' + allowedEmails.length + '명)</div>'

    allowedEmails.forEach(email => {
        const isOwner = email === '990914s@gmail.com'
        const isSelf = email === currentUser?.email?.toLowerCase()

        html += `
            <div class="user-item">
                <div class="user-item-info">
                    <span class="user-email">${email}</span>
                    ${isOwner ? '<span class="badge badge-owner">Owner</span>' : ''}
                    ${isSelf ? '<span class="badge badge-self">나</span>' : ''}
                </div>
                <div class="user-item-actions">
                    ${!isOwner ? `<button class="btn btn-small btn-danger remove-user-btn" data-email="${email}" ${isSelf ? 'disabled' : ''}>삭제</button>` : ''}
                </div>
            </div>
        `
    })

    container.innerHTML = html

    // 삭제 버튼 이벤트
    container.querySelectorAll('.remove-user-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const email = btn.dataset.email
            if (confirm(`정말 ${email} 사용자를 삭제하시겠습니까?`)) {
                try {
                    await removeAllowedEmail(email)
                    alert('삭제되었습니다.')
                } catch (error) {
                    alert('삭제에 실패했습니다.')
                }
            }
        })
    })
}

// 권한 목록 렌더링
function renderPermissionList() {
    const container = document.getElementById('permissionList')
    const admins = adminConfig.admins || {}
    const allowedEmails = getAllowedEmails()

    let html = '<div class="list-header">권한 설정</div>'

    allowedEmails.forEach(email => {
        const isOwner = email === '990914s@gmail.com'
        const userAdmin = Object.values(admins).find(a => a.email === email)
        const permissions = userAdmin?.permissions || []

        html += `
            <div class="permission-item" data-email="${email}">
                <div class="permission-user">
                    <span class="user-email">${email}</span>
                    ${isOwner ? '<span class="badge badge-owner">Owner (모든 권한)</span>' : ''}
                </div>
                ${!isOwner ? `
                    <div class="permission-checkboxes">
                        <label class="checkbox-label">
                            <input type="checkbox" class="permission-checkbox" data-permission="canManageUsers" ${permissions.includes('canManageUsers') ? 'checked' : ''}>
                            사용자 관리
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="permission-checkbox" data-permission="canManageDiscord" ${permissions.includes('canManageDiscord') ? 'checked' : ''}>
                            Discord 관리
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="permission-checkbox" data-permission="canManageTemplates" ${permissions.includes('canManageTemplates') ? 'checked' : ''}>
                            템플릿 관리
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="permission-checkbox" data-permission="canDeleteMeetings" ${permissions.includes('canDeleteMeetings') ? 'checked' : ''}>
                            회의록 삭제
                        </label>
                    </div>
                    <button class="btn btn-primary btn-small save-permission-btn" data-email="${email}">저장</button>
                ` : ''}
            </div>
        `
    })

    container.innerHTML = html

    // 저장 버튼 이벤트
    container.querySelectorAll('.save-permission-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const email = btn.dataset.email
            const item = btn.closest('.permission-item')
            const checkboxes = item.querySelectorAll('.permission-checkbox:checked')
            const permissions = Array.from(checkboxes).map(cb => cb.dataset.permission)

            try {
                const adminRef = ref(db, `adminConfig/admins/${email.replace(/[^a-zA-Z0-9]/g, '_')}`)
                await set(adminRef, {
                    email,
                    permissions,
                    updatedAt: Date.now()
                })
                alert('권한이 저장되었습니다.')
            } catch (error) {
                alert('저장에 실패했습니다.')
            }
        })
    })
}

// Discord 섹션 렌더링
function renderDiscordSection() {
    const container = document.getElementById('discordMappingList')
    const webhookInput = document.getElementById('discordWebhookUrl')
    const webhookSection = document.getElementById('webhookSection')

    // 웹훅 URL 섹션: Owner만 표시
    if (webhookSection) {
        webhookSection.style.display = isOwner() ? 'block' : 'none'
    }

    // 웹훅 URL 로드
    if (webhookInput) {
        webhookInput.value = adminConfig.discordWebhook || ''
    }

    // 사용자 Discord 매핑 목록
    const allUsers = getAllUsersWithMapping()
    const hasDiscordManagePermission = canManageDiscord()

    let html = '<div class="list-header">Discord ID 설정</div>'

    // 자기 자신을 먼저 표시
    const myData = allUsers.find(u => isOwnEmail(u.email))
    const otherUsers = allUsers.filter(u => !isOwnEmail(u.email))

    // 내 Discord ID 설정 (항상 표시)
    if (myData) {
        html += `
            <div class="discord-item my-discord-item" data-email="${myData.email}">
                <div class="discord-user-info">
                    <span class="user-email">${myData.email}</span>
                    <span class="badge badge-self">나</span>
                    ${myData.discordId ? '<span class="badge badge-success">등록됨</span>' : '<span class="badge badge-warning">미등록</span>'}
                </div>
                <div class="discord-inputs">
                    <input type="text" class="admin-input discord-id-input" value="${myData.discordId || ''}" placeholder="Discord ID">
                    <input type="text" class="admin-input discord-name-input" value="${myData.discordName || ''}" placeholder="닉네임">
                    <button class="btn btn-primary btn-small save-discord-btn"
                            data-uid="${myData.uid || ''}"
                            data-email="${myData.email}"
                            data-is-self="true">저장</button>
                </div>
            </div>
        `
    }

    // 다른 사용자: canManageDiscord 권한이 있을 때만 표시
    if (hasDiscordManagePermission && otherUsers.length > 0) {
        html += '<div class="list-header" style="margin-top: 20px;">다른 사용자 Discord ID 관리</div>'

        otherUsers.forEach(user => {
            html += `
                <div class="discord-item" data-email="${user.email}">
                    <div class="discord-user-info">
                        <span class="user-email">${user.email}</span>
                        ${user.discordId ? '<span class="badge badge-success">등록됨</span>' : '<span class="badge badge-warning">미등록</span>'}
                    </div>
                    <div class="discord-inputs">
                        <input type="text" class="admin-input discord-id-input" value="${user.discordId || ''}" placeholder="Discord ID">
                        <input type="text" class="admin-input discord-name-input" value="${user.discordName || ''}" placeholder="닉네임">
                        <button class="btn btn-primary btn-small save-discord-btn"
                                data-uid="${user.uid || ''}"
                                data-email="${user.email}"
                                data-is-self="false">저장</button>
                    </div>
                </div>
            `
        })
    }

    container.innerHTML = html

    // Discord ID 저장 버튼 이벤트
    container.querySelectorAll('.save-discord-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const email = btn.dataset.email
            const uid = btn.dataset.uid || `pending_${email.replace(/[^a-zA-Z0-9]/g, '_')}`
            const isSelf = btn.dataset.isSelf === 'true'
            const item = btn.closest('.discord-item')
            const discordId = item.querySelector('.discord-id-input').value.trim()
            const discordName = item.querySelector('.discord-name-input').value.trim()

            // 권한 체크: 자기 자신이 아니면 canManageDiscord 필요
            if (!isSelf && !canManageDiscord()) {
                alert('다른 사용자의 Discord ID를 수정할 권한이 없습니다.')
                return
            }

            if (discordId && !/^\d{17,19}$/.test(discordId)) {
                alert('Discord ID는 17-19자리 숫자입니다.')
                return
            }

            try {
                if (isSelf) {
                    await saveMyDiscordId(discordId, discordName)
                } else {
                    await saveDiscordIdForUser(uid, email, '', discordId, discordName)
                }
                alert('저장되었습니다.')
            } catch (error) {
                alert('저장에 실패했습니다.')
            }
        })
    })
}

// 웹훅 URL 저장
async function saveWebhookUrl() {
    const url = document.getElementById('discordWebhookUrl').value.trim()

    try {
        const webhookRef = ref(db, 'adminConfig/discordWebhook')
        await set(webhookRef, url)
        alert('웹훅 URL이 저장되었습니다.')
    } catch (error) {
        alert('저장에 실패했습니다.')
    }
}

// 사용자 추가 핸들러
async function handleAddUser() {
    const input = document.getElementById('newUserEmail')
    const email = input.value.trim().toLowerCase()

    if (!email) {
        alert('이메일을 입력해주세요.')
        return
    }

    // 이메일 형식 검증
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('올바른 이메일 형식이 아닙니다.')
        return
    }

    // 이미 등록된 이메일인지 확인
    const allowedEmails = getAllowedEmails()
    if (allowedEmails.includes(email)) {
        alert('이미 등록된 이메일입니다.')
        return
    }

    try {
        await addAllowedEmail(email)
        input.value = ''
        alert('사용자가 추가되었습니다.')
    } catch (error) {
        alert('추가에 실패했습니다.')
    }
}

// 앱 초기화
function initAdmin() {
    showLoading()

    // 인증 상태 콜백
    setAuthStateCallback((user) => {
        if (user) {
            // 관리자 권한 확인
            if (isAdmin(user.email)) {
                showAdminScreen(user)
                setupAdminConfigListener()
                setupAllowedEmailsListener()
                setupDiscordMappingListener()
                setupPermissionListener()

                // 허용 이메일 목록 변경 시 리렌더링
                setAllowedEmailsCallback(() => {
                    if (currentSection === 'users' || currentSection === 'permissions') {
                        renderCurrentSection()
                    }
                })

                setDiscordMappingCallback(() => {
                    if (currentSection === 'discord') {
                        renderDiscordSection()
                    }
                })

                // 권한 변경 시 네비게이션 및 현재 섹션 업데이트
                setPermissionCallback(() => {
                    updateNavigationVisibility()
                    renderCurrentSection()
                })
            } else {
                showAccessDenied()
            }
        } else {
            // 로그인 안 됨 - 메인으로 리다이렉트
            window.location.href = '/meeting/'
        }
    })

    // 인증 리스너 시작
    initAuthListener()

    // 네비게이션 이벤트
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            switchSection(item.dataset.section)
        })
    })

    // 로그아웃 버튼
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        removeAdminConfigListener()
        removeAllowedEmailsListener()
        removeDiscordMappingListener()
        removePermissionListener()
        await logout()
    })

    // 웹훅 저장 버튼
    document.getElementById('saveWebhookBtn')?.addEventListener('click', saveWebhookUrl)

    // 웹훅 테스트 버튼
    document.getElementById('testWebhookBtn')?.addEventListener('click', async () => {
        const webhookUrl = document.getElementById('discordWebhookUrl').value.trim()

        if (!webhookUrl) {
            alert('웹훅 URL을 먼저 입력해주세요.')
            return
        }

        const btn = document.getElementById('testWebhookBtn')
        btn.disabled = true
        btn.textContent = '전송 중...'

        try {
            const success = await sendTestMessage(webhookUrl)
            if (success) {
                alert('테스트 메시지가 전송되었습니다! Discord 채널을 확인하세요.')
            } else {
                alert('전송에 실패했습니다. 웹훅 URL을 확인해주세요.')
            }
        } catch (error) {
            alert('전송 중 오류가 발생했습니다.')
        } finally {
            btn.disabled = false
            btn.textContent = '테스트 전송'
        }
    })

    // 사용자 추가 버튼
    document.getElementById('addUserBtn')?.addEventListener('click', handleAddUser)

    // Enter 키로 사용자 추가
    document.getElementById('newUserEmail')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddUser()
        }
    })
}

document.addEventListener('DOMContentLoaded', initAdmin)
