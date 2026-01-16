import './styles/main.css'

import { showLoading, hideLoading } from './utils/helpers.js'
import { initAuthListener, setAuthStateCallback, getCurrentUser } from './services/auth-service.js'
import { setupCalendarListener, removeCalendarListener, setEventCallback, createEvent, deleteEvent, getEventsByDate, getEventsByMonth } from './services/calendar-service.js'
import { setupProjectsListener, removeProjectsListener, setProjectCallback, getProjects, getProjectById, getMyAssignedTasks, setupProjectDetailListener, setMilestoneCallback, setTaskCallback, getMilestones, getTasks } from './services/project-service.js'
import { setupPermissionListener, removePermissionListener, isOwner } from './services/permission-service.js'
import { setupAllowedEmailsListener, removeAllowedEmailsListener } from './services/allowed-emails-service.js'

// 상태 변수
let currentDate = new Date()
let selectedDate = null
let allEvents = []
let selectedProjectId = localStorage.getItem('selectedProjectId') || null

// DOM 요소
const loadingOverlay = document.getElementById('loadingOverlay')
const authContainer = document.getElementById('authContainer')
const appContainer = document.getElementById('appContainer')

// 인증 화면 표시
function showAuthScreen() {
    authContainer.style.display = 'flex'
    appContainer.classList.add('app-hidden')
}

// 앱 화면 표시
function showAppScreen(user) {
    authContainer.style.display = 'none'
    appContainer.classList.remove('app-hidden')

    // 사용자 정보 표시
    document.getElementById('userAvatar').src = user.photoURL || ''
    document.getElementById('userName').textContent = user.displayName || user.email

    // 관리자 버튼 표시
    const adminBtn = document.getElementById('adminBtn')
    if (adminBtn) {
        adminBtn.style.display = isOwner() ? 'inline-flex' : 'none'
    }
}

// 캘린더 렌더링
function renderCalendar() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // 타이틀 업데이트
    document.getElementById('calendarTitle').textContent = `${year}년 ${month + 1}월`

    // 첫째 날과 마지막 날
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    // 이번 달 일정
    const monthEvents = getEventsByMonth(year, month)

    // 날짜 그리드 생성
    const calendarDays = document.getElementById('calendarDays')
    calendarDays.innerHTML = ''

    // 이전 달 빈 칸
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyDay = document.createElement('div')
        emptyDay.className = 'calendar-day empty'
        calendarDays.appendChild(emptyDay)
    }

    // 오늘 날짜
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // 날짜 생성
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const dayEvents = monthEvents.filter(e => e.date === dateStr)

        const dayElement = document.createElement('div')
        dayElement.className = 'calendar-day'
        dayElement.dataset.date = dateStr

        if (dateStr === todayStr) {
            dayElement.classList.add('today')
        }

        if (selectedDate === dateStr) {
            dayElement.classList.add('selected')
        }

        // 날짜 숫자
        const dayNumber = document.createElement('span')
        dayNumber.className = 'day-number'
        dayNumber.textContent = day
        dayElement.appendChild(dayNumber)

        // 이벤트 도트
        if (dayEvents.length > 0) {
            const dotsContainer = document.createElement('div')
            dotsContainer.className = 'event-dots'

            const hasShared = dayEvents.some(e => e.isShared)
            const hasPersonal = dayEvents.some(e => !e.isShared)

            if (hasShared) {
                const sharedDot = document.createElement('span')
                sharedDot.className = 'dot shared'
                dotsContainer.appendChild(sharedDot)
            }
            if (hasPersonal) {
                const personalDot = document.createElement('span')
                personalDot.className = 'dot personal'
                dotsContainer.appendChild(personalDot)
            }

            dayElement.appendChild(dotsContainer)
        }

        // 클릭 이벤트
        dayElement.addEventListener('click', () => selectDate(dateStr))

        calendarDays.appendChild(dayElement)
    }
}

// 날짜 선택
function selectDate(dateStr) {
    selectedDate = dateStr
    renderCalendar()
    showDateEvents(dateStr)
}

// 선택된 날짜의 일정 표시 (모달로)
function showDateEvents(dateStr) {
    const events = getEventsByDate(dateStr)

    if (events.length === 0) {
        // 일정이 없으면 추가 모달 열기
        openEventModal(dateStr)
        return
    }

    // 첫 번째 일정 상세 표시
    showEventDetail(events[0], dateStr)
}

// 일정 상세 모달 표시
function showEventDetail(event, dateStr) {
    const modal = document.getElementById('eventDetailModal')
    document.getElementById('eventDetailTitle').textContent = event.title

    const content = document.getElementById('eventDetailContent')
    const timeStr = event.time ? ` ${event.time}` : ''
    const typeStr = event.isShared ? '공유 일정' : '개인 일정'

    // 해당 날짜의 모든 일정 표시
    const dayEvents = getEventsByDate(dateStr)

    content.innerHTML = `
        <div class="event-list-in-modal">
            ${dayEvents.map(e => `
                <div class="event-item ${e.id === event.id ? 'active' : ''}" data-id="${e.id}" data-shared="${e.isShared}">
                    <div class="event-type ${e.isShared ? 'shared' : 'personal'}">${e.isShared ? '공유' : '개인'}</div>
                    <div class="event-info">
                        <div class="event-title">${e.title}</div>
                        <div class="event-time">${e.time || '종일'}</div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="event-detail-info">
            <p><strong>날짜:</strong> ${dateStr}${timeStr}</p>
            <p><strong>유형:</strong> ${typeStr}</p>
            ${event.description ? `<p><strong>설명:</strong> ${event.description}</p>` : ''}
            <p><strong>작성자:</strong> ${event.createdByName || event.createdByEmail}</p>
        </div>
    `

    // 일정 항목 클릭 이벤트
    content.querySelectorAll('.event-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id
            const clickedEvent = dayEvents.find(e => e.id === id)
            if (clickedEvent) {
                showEventDetail(clickedEvent, dateStr)
            }
        })
    })

    // 삭제 버튼 설정
    const deleteBtn = document.getElementById('deleteEventBtn')
    deleteBtn.onclick = async () => {
        if (confirm('이 일정을 삭제하시겠습니까?')) {
            await deleteEvent(event.id, event.isShared)
            modal.style.display = 'none'
            renderCalendar()
        }
    }

    modal.style.display = 'flex'
}

// 일정 추가 모달 열기
function openEventModal(dateStr = null) {
    const modal = document.getElementById('eventModal')
    const dateInput = document.getElementById('eventDate')

    // 초기화
    document.getElementById('eventTitle').value = ''
    document.getElementById('eventTime').value = ''
    document.getElementById('eventDescription').value = ''

    if (dateStr) {
        dateInput.value = dateStr
    } else {
        dateInput.value = new Date().toISOString().split('T')[0]
    }

    // 타입 선택 초기화
    document.querySelectorAll('#eventTypeSelect .type-option').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.type === 'shared')
    })

    modal.style.display = 'flex'
}

// 할당된 태스크 렌더링
async function renderMyTasks() {
    const tasksList = document.getElementById('myTasksList')

    try {
        const myTasks = await getMyAssignedTasks()

        if (myTasks.length === 0) {
            tasksList.innerHTML = '<div class="empty-tasks">할당된 일정이 없습니다</div>'
            return
        }

        tasksList.innerHTML = myTasks.map(task => {
            const statusClass = task.status === 'completed' ? 'completed' : task.status === 'in_progress' ? 'in-progress' : 'pending'
            const statusText = task.status === 'completed' ? '완료' : task.status === 'in_progress' ? '진행중' : '대기'
            const priorityClass = task.priority || 'medium'

            return `
                <div class="task-item ${statusClass}">
                    <div class="task-status ${statusClass}">${statusText}</div>
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        <div class="task-project">${task.projectTitle}</div>
                    </div>
                    <div class="task-meta">
                        <span class="task-priority ${priorityClass}">${task.priority === 'high' ? '높음' : task.priority === 'low' ? '낮음' : '보통'}</span>
                        <span class="task-date">${task.endDate || '-'}</span>
                    </div>
                </div>
            `
        }).join('')
    } catch (error) {
        console.error('Failed to load tasks:', error)
        tasksList.innerHTML = '<div class="empty-tasks">태스크를 불러오는데 실패했습니다</div>'
    }
}

// 프로젝트 목록 렌더링
function renderProjectSelect(projects) {
    const select = document.getElementById('projectSelect')

    select.innerHTML = '<option value="">프로젝트 선택...</option>' +
        projects.map(p => `<option value="${p.id}" ${p.id === selectedProjectId ? 'selected' : ''}>${p.title}</option>`).join('')

    // 저장된 프로젝트가 있으면 표시
    if (selectedProjectId) {
        renderProjectSummary(selectedProjectId)
    }
}

// 프로젝트 요약 렌더링
function renderProjectSummary(projectId) {
    const summary = document.getElementById('projectSummary')
    const project = getProjectById(projectId)

    if (!project) {
        summary.innerHTML = `
            <div class="empty-project">
                <div class="empty-icon">📁</div>
                <div class="empty-text">프로젝트를 선택하세요</div>
                <a href="./projects.html" class="btn btn-primary">프로젝트 관리 →</a>
            </div>
        `
        return
    }

    // 프로젝트 상세 리스너 설정 (마일스톤, 태스크)
    setupProjectDetailListener(projectId)

    // 상세 정보 렌더링 (리스너 콜백에서 처리)
    renderProjectSummaryContent(project)
}

// 프로젝트 요약 컨텐츠 렌더링
function renderProjectSummaryContent(project) {
    const summary = document.getElementById('projectSummary')
    const milestones = getMilestones()
    const tasks = getTasks()

    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const totalTasks = tasks.length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // D-Day 계산
    let dDayText = ''
    if (project.endDate) {
        const endDate = new Date(project.endDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        endDate.setHours(0, 0, 0, 0)
        const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))

        if (diffDays < 0) {
            dDayText = `D+${Math.abs(diffDays)} (지남)`
        } else if (diffDays === 0) {
            dDayText = 'D-Day'
        } else {
            dDayText = `D-${diffDays}`
        }
    }

    summary.innerHTML = `
        <div class="project-summary-content">
            <div class="summary-header">
                <h3>${project.title}</h3>
                <span class="project-status ${project.status}">${project.status === 'active' ? '진행중' : '완료'}</span>
            </div>

            <div class="summary-stats">
                <div class="stat-item">
                    <div class="stat-value">${progress}%</div>
                    <div class="stat-label">진행률</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${completedTasks}/${totalTasks}</div>
                    <div class="stat-label">태스크</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${milestones.length}</div>
                    <div class="stat-label">마일스톤</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${dDayText || '-'}</div>
                    <div class="stat-label">마감일</div>
                </div>
            </div>

            ${project.description ? `<p class="project-desc">${project.description}</p>` : ''}

            <div class="summary-actions">
                <a href="./projects.html?id=${project.id}" class="btn btn-primary">상세 보기 →</a>
            </div>
        </div>
    `
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 로그인 버튼
    document.getElementById('googleLoginBtn').addEventListener('click', async () => {
        const { loginWithGoogle } = await import('./services/auth-service.js')
        await loginWithGoogle()
    })

    // 로그아웃 버튼
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        const { logout } = await import('./services/auth-service.js')
        await logout()
    })

    // 이전/다음 달 버튼
    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1)
        renderCalendar()
    })

    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1)
        renderCalendar()
    })

    // 일정 추가 버튼
    document.getElementById('addEventBtn').addEventListener('click', () => {
        openEventModal()
    })

    // 일정 타입 선택
    document.querySelectorAll('#eventTypeSelect .type-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#eventTypeSelect .type-option').forEach(b => b.classList.remove('selected'))
            btn.classList.add('selected')
        })
    })

    // 일정 추가 모달 닫기
    document.getElementById('eventModalCloseBtn').addEventListener('click', () => {
        document.getElementById('eventModal').style.display = 'none'
    })

    // 일정 추가 확인
    document.getElementById('eventConfirmBtn').addEventListener('click', async () => {
        const title = document.getElementById('eventTitle').value.trim()
        const date = document.getElementById('eventDate').value
        const time = document.getElementById('eventTime').value
        const description = document.getElementById('eventDescription').value.trim()
        const isShared = document.querySelector('#eventTypeSelect .type-option.selected').dataset.type === 'shared'

        if (!title || !date) {
            alert('제목과 날짜를 입력하세요.')
            return
        }

        await createEvent({ title, date, time, description, isShared })
        document.getElementById('eventModal').style.display = 'none'
        renderCalendar()
    })

    // 일정 상세 모달 닫기
    document.getElementById('eventDetailCloseBtn').addEventListener('click', () => {
        document.getElementById('eventDetailModal').style.display = 'none'
    })

    // 프로젝트 선택
    document.getElementById('projectSelect').addEventListener('change', (e) => {
        selectedProjectId = e.target.value || null
        localStorage.setItem('selectedProjectId', selectedProjectId || '')
        if (selectedProjectId) {
            renderProjectSummary(selectedProjectId)
        } else {
            document.getElementById('projectSummary').innerHTML = `
                <div class="empty-project">
                    <div class="empty-icon">📁</div>
                    <div class="empty-text">프로젝트를 선택하세요</div>
                    <a href="./projects.html" class="btn btn-primary">프로젝트 관리 →</a>
                </div>
            `
        }
    })

    // 모달 외부 클릭 시 닫기
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none'
            }
        })
    })
}

// 앱 초기화
function initApp() {
    showLoading()

    setupEventListeners()

    // 캘린더 이벤트 콜백
    setEventCallback((events) => {
        allEvents = events
        renderCalendar()
        hideLoading()
    })

    // 프로젝트 콜백
    setProjectCallback((projects) => {
        renderProjectSelect(projects)
        renderMyTasks()
    })

    // 마일스톤/태스크 콜백 (프로젝트 요약 업데이트용)
    setMilestoneCallback(() => {
        if (selectedProjectId) {
            const project = getProjectById(selectedProjectId)
            if (project) {
                renderProjectSummaryContent(project)
            }
        }
    })

    setTaskCallback(() => {
        if (selectedProjectId) {
            const project = getProjectById(selectedProjectId)
            if (project) {
                renderProjectSummaryContent(project)
            }
        }
        renderMyTasks()
    })

    // 인증 상태 변경 콜백
    setAuthStateCallback((user) => {
        if (user) {
            showAppScreen(user)
            setupCalendarListener()
            setupProjectsListener()
            setupPermissionListener()
            setupAllowedEmailsListener()
            renderCalendar()
        } else {
            removeCalendarListener()
            removeProjectsListener()
            removePermissionListener()
            removeAllowedEmailsListener()
            showAuthScreen()
            hideLoading()
        }
    })

    // 인증 리스너 시작
    initAuthListener()
}

// DOM 로드 시 앱 초기화
document.addEventListener('DOMContentLoaded', initApp)
