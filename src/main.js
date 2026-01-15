import './styles/main.css'

import { showLoading, hideLoading } from './utils/helpers.js'
import { initAuthListener, setAuthStateCallback } from './services/auth-service.js'
import { setupMeetingsListener, setMeetingsCallback, getMeetingById, getMeetings } from './services/meeting-service.js'
import { loadCategories, updateCategoriesFromMeetings, setCategoryChangeCallback } from './services/category-service.js'
import { loadTemplates } from './services/template-service.js'

import { showAuthScreen, showAppScreen, setupAuthUI } from './ui/auth-ui.js'
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
    showNewMeetingModal
} from './ui/modals.js'

// 전역 함수 노출 (HTML onclick 이벤트용)
window.appFunctions = {
    showCategoryModal,
    showTemplateModal,
    showUploadModal,
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

        // 현재 선택된 회의록 업데이트
        const currentId = getCurrentMeetingId()
        if (currentId) {
            const currentMeeting = meetings.find(m => m.id === currentId)
            if (currentMeeting) {
                updateContentView(currentMeeting)
            }
        }
    })

    // 인증 상태 변경 콜백
    setAuthStateCallback((user) => {
        if (user) {
            showAppScreen(user)
            setupMeetingsListener()
        } else {
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
