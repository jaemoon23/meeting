import './styles/main.css'

import { showLoading, hideLoading } from './utils/helpers.js'
import { initAuthListener, setAuthStateCallback } from './services/auth-service.js'
import { setupMeetingsListener, setMeetingsCallback, getMeetingById, getMeetings } from './services/meeting-service.js'
import { loadCategories, updateCategoriesFromMeetings, setCategoryChangeCallback } from './services/category-service.js'
import { loadTemplates, setupTemplatesListener } from './services/template-service.js'
import { setupPresence, removePresence, setPresenceCallback } from './services/presence-service.js'
import { setupDiscordMappingListener, removeDiscordMappingListener } from './services/discord-mapping-service.js'
import { setupPermissionListener, removePermissionListener, setPermissionCallback } from './services/permission-service.js'
import { setupAllowedEmailsListener, removeAllowedEmailsListener } from './services/allowed-emails-service.js'

import { showAuthScreen, showAppScreen, setupAuthUI } from './ui/auth-ui.js'
import { renderOnlineUsers } from './ui/presence-ui.js'
import {
    renderCategoryTabs,
    renderMeetingList,
    setupSearch,
    setOnMeetingSelectCallback,
    setOnMeetingDeleteCallback,
    getCurrentMeetingId
} from './ui/meeting-list.js'
import { showEmptyState, showContentView, updateContentView, setupEditor } from './ui/editor.js'
import {
    setupModals,
    setOnMeetingCreatedCallback,
    showCategoryModal,
    showTemplateModal,
    showUploadModal,
    showNewMeetingModal,
    showDiscordSettingsModal
} from './ui/modals.js'

// 전역 함수 노출 (HTML onclick 이벤트용)
window.appFunctions = {
    showCategoryModal,
    showTemplateModal,
    showUploadModal,
    showDiscordSettingsModal,
    createNewMeeting: showNewMeetingModal
}

// 앱 초기화
function initApp() {
    showLoading()

    // 템플릿 및 카테고리 로드
    loadTemplates()
    loadCategories()

    // UI 셋업
    setupAuthUI()
    setupSearch()
    setupEditor()
    setupModals()

    // 회의록 선택 콜백
    setOnMeetingSelectCallback((id) => {
        const meeting = getMeetingById(id)
        if (meeting) {
            showContentView(meeting)
        }
    })

    // 회의록 삭제 콜백
    setOnMeetingDeleteCallback(() => {
        showEmptyState()
    })

    // 회의록 생성 콜백
    setOnMeetingCreatedCallback((id) => {
        const meeting = getMeetingById(id)
        if (meeting) {
            showContentView(meeting)
            renderMeetingList()
        }
    })

    // 카테고리 변경 콜백
    setCategoryChangeCallback(() => {
        const meetings = getMeetingsFromService()
        renderCategoryTabs(meetings)
        renderMeetingList()
    })

    // 회의록 데이터 변경 콜백
    setMeetingsCallback((meetings) => {
        updateCategoriesFromMeetings()
        renderCategoryTabs(meetings)
        renderMeetingList()
        hideLoading()

        // URL 파라미터에서 회의록 ID 확인 (Discord 알림 링크 등)
        const urlParams = new URLSearchParams(window.location.search)
        const meetingIdFromUrl = urlParams.get('id')

        if (meetingIdFromUrl && !getCurrentMeetingId()) {
            const meetingFromUrl = meetings.find(m => m.id === meetingIdFromUrl)
            if (meetingFromUrl) {
                showContentView(meetingFromUrl)
                // URL 파라미터 제거 (히스토리 정리)
                window.history.replaceState({}, '', window.location.pathname)
                return
            }
        }

        // 현재 선택된 회의록 업데이트
        const currentId = getCurrentMeetingId()
        if (currentId) {
            const currentMeeting = meetings.find(m => m.id === currentId)
            if (currentMeeting) {
                updateContentView(currentMeeting)
            }
        }
    })

    // Presence 콜백 설정
    setPresenceCallback((onlineUsers) => {
        renderOnlineUsers(onlineUsers)
    })

    // 인증 상태 변경 콜백
    setAuthStateCallback((user) => {
        if (user) {
            showAppScreen(user)
            setupMeetingsListener()
            setupTemplatesListener()
            setupPresence(user)
            setupDiscordMappingListener()
            setupPermissionListener()
            setupAllowedEmailsListener()

            // 권한 변경 시 UI 업데이트 (삭제 버튼 표시/숨김)
            setPermissionCallback(() => {
                renderMeetingList()
            })
        } else {
            removePresence()
            removeDiscordMappingListener()
            removePermissionListener()
            removeAllowedEmailsListener()
            showAuthScreen()
            hideLoading()
        }
    })

    // 인증 리스너 시작
    initAuthListener()
}

function getMeetingsFromService() {
    return getMeetings()
}

// DOM 로드 시 앱 초기화
document.addEventListener('DOMContentLoaded', initApp)
