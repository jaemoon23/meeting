import './styles/main.css'

import { showLoading, hideLoading } from './utils/helpers.js'
import { initAuthListener, setAuthStateCallback, getCurrentUser } from './services/auth-service.js'
import {
    setupProjectsListener, removeProjectsListener, setProjectCallback,
    setupProjectDetailListener, removeProjectDetailListener,
    setMilestoneCallback, setTaskCallback,
    getProjects, getProjectById, getMilestones, getTasks, getTasksByMilestone,
    createProject, updateProject, deleteProject,
    createMilestone, updateMilestone, deleteMilestone,
    createTask, updateTask, deleteTask,
    addProjectMember, removeProjectMember, updateMemberRole,
    calculateProjectProgress
} from './services/project-service.js'
import { setupPermissionListener, removePermissionListener, isOwner } from './services/permission-service.js'
import { setupAllowedEmailsListener, removeAllowedEmailsListener, getAllowedEmails, setAllowedEmailsCallback } from './services/allowed-emails-service.js'

// 상태 변수
let currentProjectId = null
let currentTab = 'overview'
let currentFilter = 'all'
let editingProjectId = null
let editingMilestoneId = null
let editingTaskId = null
let ganttZoom = 'month'

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

    document.getElementById('userAvatar').src = user.photoURL || ''
    document.getElementById('userName').textContent = user.displayName || user.email

    const adminBtn = document.getElementById('adminBtn')
    if (adminBtn) {
        adminBtn.style.display = isOwner() ? 'inline-flex' : 'none'
    }
}

// 프로젝트 목록 렌더링
function renderProjectList(projects) {
    const grid = document.getElementById('projectsGrid')

    // 필터 적용
    let filtered = projects
    if (currentFilter === 'active') {
        filtered = projects.filter(p => p.status === 'active')
    } else if (currentFilter === 'completed') {
        filtered = projects.filter(p => p.status === 'completed')
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-projects">
                <div class="empty-icon">📁</div>
                <div class="empty-text">프로젝트가 없습니다</div>
            </div>
        `
        return
    }

    grid.innerHTML = filtered.map(project => {
        const memberCount = project.members?.length || 0
        const progress = 0 // 실제 진행률은 태스크 로드 후 계산

        return `
            <div class="project-card" data-id="${project.id}">
                <div class="project-card-header">
                    <h3>${project.title}</h3>
                    <span class="project-status ${project.status}">${project.status === 'active' ? '진행중' : '완료'}</span>
                </div>
                <p class="project-card-desc">${project.description || '설명 없음'}</p>
                <div class="project-card-meta">
                    <span class="meta-item">👥 ${memberCount}명</span>
                    <span class="meta-item">📅 ${project.endDate || '-'}</span>
                </div>
                <div class="project-card-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">${progress}%</span>
                </div>
            </div>
        `
    }).join('')

    // 프로젝트 카드 클릭 이벤트
    grid.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => {
            showProjectDetail(card.dataset.id)
        })
    })
}

// 프로젝트 상세 보기
function showProjectDetail(projectId) {
    currentProjectId = projectId
    const project = getProjectById(projectId)

    if (!project) return

    // URL 업데이트
    history.pushState({ projectId }, '', `?id=${projectId}`)

    // 뷰 전환
    document.getElementById('projectListView').style.display = 'none'
    document.getElementById('projectDetailView').style.display = 'block'

    // 제목 설정
    document.getElementById('projectDetailTitle').textContent = project.title

    // 상세 리스너 설정
    setupProjectDetailListener(projectId)

    // 탭 초기화
    switchTab('overview')
}

// 목록으로 돌아가기
function backToList() {
    currentProjectId = null
    removeProjectDetailListener()

    history.pushState({}, '', '/projects.html')

    document.getElementById('projectDetailView').style.display = 'none'
    document.getElementById('projectListView').style.display = 'block'
}

// 탭 전환
function switchTab(tab) {
    currentTab = tab

    // 탭 버튼 활성화
    document.querySelectorAll('.detail-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab)
    })

    // 패널 표시
    document.getElementById('overviewPane').style.display = tab === 'overview' ? 'block' : 'none'
    document.getElementById('ganttPane').style.display = tab === 'gantt' ? 'block' : 'none'
    document.getElementById('tasksPane').style.display = tab === 'tasks' ? 'block' : 'none'
    document.getElementById('membersPane').style.display = tab === 'members' ? 'block' : 'none'

    // 탭별 렌더링
    if (tab === 'overview') renderOverview()
    if (tab === 'gantt') renderGanttChart()
    if (tab === 'tasks') renderTasks()
    if (tab === 'members') renderMembers()
}

// 개요 탭 렌더링
function renderOverview() {
    const project = getProjectById(currentProjectId)
    if (!project) return

    const tasks = getTasks()
    const milestones = getMilestones()
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
    const totalTasks = tasks.length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // 진행률
    document.querySelector('#projectProgress .progress-value').textContent = `${progress}%`

    // 기간
    const dateRange = document.getElementById('projectDateRange')
    dateRange.querySelector('.start-date').textContent = project.startDate || '-'
    dateRange.querySelector('.end-date').textContent = project.endDate || '-'

    // 남은 일수
    const daysRemaining = document.getElementById('daysRemaining')
    if (project.endDate) {
        const endDate = new Date(project.endDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        endDate.setHours(0, 0, 0, 0)
        const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))

        if (diffDays < 0) {
            daysRemaining.textContent = `D+${Math.abs(diffDays)} (마감일 지남)`
            daysRemaining.className = 'days-remaining overdue'
        } else if (diffDays === 0) {
            daysRemaining.textContent = 'D-Day'
            daysRemaining.className = 'days-remaining today'
        } else {
            daysRemaining.textContent = `D-${diffDays}`
            daysRemaining.className = 'days-remaining'
        }
    } else {
        daysRemaining.textContent = '-'
    }

    // 태스크 통계
    const taskStats = document.getElementById('taskStats')
    taskStats.innerHTML = `
        <div class="stat"><span class="count">${totalTasks}</span><span class="label">전체</span></div>
        <div class="stat"><span class="count">${completedTasks}</span><span class="label">완료</span></div>
        <div class="stat"><span class="count">${inProgressTasks}</span><span class="label">진행중</span></div>
    `

    // 설명
    document.getElementById('projectDescription').textContent = project.description || '설명이 없습니다.'
}

// 간트 차트 렌더링
function renderGanttChart() {
    const project = getProjectById(currentProjectId)
    if (!project) return

    const milestones = getMilestones()
    const tasks = getTasks()
    const container = document.getElementById('ganttChart')

    // 색상 팔레트
    const colorPalette = ['blue', 'purple', 'green', 'orange', 'pink', 'cyan']

    // 빈 상태
    if (milestones.length === 0 && tasks.length === 0) {
        container.innerHTML = `
            <div class="gantt-card">
                <div class="gantt-empty">
                    <div class="gantt-empty-icon">📊</div>
                    <div class="gantt-empty-text">마일스톤이나 태스크가 없습니다</div>
                    <button class="btn btn-primary gantt-add-milestone-btn">+ 마일스톤 추가</button>
                </div>
            </div>
        `
        return
    }

    // 날짜 범위 계산
    const allDates = []
    if (project.startDate) allDates.push(new Date(project.startDate))
    if (project.endDate) allDates.push(new Date(project.endDate))
    milestones.forEach(m => {
        if (m.startDate) allDates.push(new Date(m.startDate))
        if (m.endDate) allDates.push(new Date(m.endDate))
    })
    tasks.forEach(t => {
        if (t.startDate) allDates.push(new Date(t.startDate))
        if (t.endDate) allDates.push(new Date(t.endDate))
    })

    if (allDates.length === 0) {
        container.innerHTML = `
            <div class="gantt-card">
                <div class="gantt-empty">
                    <div class="gantt-empty-icon">📅</div>
                    <div class="gantt-empty-text">날짜 정보가 없습니다</div>
                </div>
            </div>
        `
        return
    }

    const minDate = new Date(Math.min(...allDates))
    const maxDate = new Date(Math.max(...allDates))

    // 월 단위로 확장
    minDate.setDate(1)
    maxDate.setMonth(maxDate.getMonth() + 1, 0)

    // 월 목록 생성
    const months = []
    const currentMonth = new Date(minDate)
    while (currentMonth <= maxDate) {
        months.push({
            year: currentMonth.getFullYear(),
            month: currentMonth.getMonth(),
            name: `${currentMonth.getMonth() + 1}월`
        })
        currentMonth.setMonth(currentMonth.getMonth() + 1)
    }

    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1
    const columnWidth = ganttZoom === 'week' ? 200 : ganttZoom === 'month' ? 120 : 80

    // 태스크 목록 (왼쪽) HTML 생성
    let taskListHtml = `
        <div class="gantt-task-list">
            <div class="gantt-task-header">태스크</div>
    `

    // 타임라인 행 (오른쪽) HTML 생성
    let timelineRowsHtml = ''

    // 마일스톤별로 그룹 생성
    milestones.forEach((milestone, milestoneIndex) => {
        const milestoneTasks = tasks.filter(t => t.milestoneId === milestone.id)
        const colorClass = colorPalette[milestoneIndex % colorPalette.length]

        // 마일스톤 진행률 계산
        const completedTasks = milestoneTasks.filter(t => t.status === 'completed').length
        const milestoneProgress = milestoneTasks.length > 0
            ? Math.round((completedTasks / milestoneTasks.length) * 100)
            : 0

        // 태스크 목록 - 그룹 헤더
        taskListHtml += `
            <div class="gantt-task-group expanded" data-milestone="${milestone.id}">
                <div class="gantt-group-title">
                    <span class="gantt-group-icon ${colorClass}"></span>
                    ${milestone.title}
                    <span class="gantt-expand-icon">▶</span>
                </div>
        `

        // 태스크 목록 - 그룹 내 태스크
        milestoneTasks.forEach(task => {
            const statusClass = task.status === 'completed' ? 'done' : task.status === 'in_progress' ? 'progress' : 'pending'
            taskListHtml += `
                <div class="gantt-task-item" data-task="${task.id}">
                    <span class="gantt-task-status ${statusClass}"></span>
                    ${task.title}
                </div>
            `
        })

        taskListHtml += '</div>'

        // 타임라인 - 마일스톤 바
        const msStart = milestone.startDate ? new Date(milestone.startDate) : minDate
        const msEnd = milestone.endDate ? new Date(milestone.endDate) : maxDate
        const msStartOffset = Math.max(0, (msStart - minDate) / (1000 * 60 * 60 * 24))
        const msDuration = Math.max(1, (msEnd - msStart) / (1000 * 60 * 60 * 24) + 1)
        const msLeft = (msStartOffset / totalDays) * (months.length * columnWidth)
        const msWidth = (msDuration / totalDays) * (months.length * columnWidth)

        timelineRowsHtml += `
            <div class="gantt-timeline-row group-row">
                ${months.map(() => '<div class="gantt-timeline-cell"></div>').join('')}
                <div class="gantt-bar ${colorClass}" style="left: ${msLeft}px; width: ${Math.max(80, msWidth)}px;">
                    ${milestone.title}
                    <div class="gantt-progress-track">
                        <div class="gantt-progress-fill" style="width: ${milestoneProgress}%;"></div>
                    </div>
                </div>
                ${milestone.endDate ? `<div class="gantt-milestone-marker" style="left: ${msLeft + Math.max(80, msWidth) + 12}px;" title="${milestone.title} 완료"></div>` : ''}
            </div>
        `

        // 타임라인 - 각 태스크 바
        milestoneTasks.forEach(task => {
            const taskStart = task.startDate ? new Date(task.startDate) : msStart
            const taskEnd = task.endDate ? new Date(task.endDate) : taskStart
            const taskStartOffset = Math.max(0, (taskStart - minDate) / (1000 * 60 * 60 * 24))
            const taskDuration = Math.max(1, (taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1)
            const taskLeft = (taskStartOffset / totalDays) * (months.length * columnWidth)
            const taskWidth = (taskDuration / totalDays) * (months.length * columnWidth)
            const taskProgress = task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0

            timelineRowsHtml += `
                <div class="gantt-timeline-row" data-task="${task.id}">
                    ${months.map(() => '<div class="gantt-timeline-cell"></div>').join('')}
                    <div class="gantt-bar ${colorClass} task-bar" style="left: ${taskLeft}px; width: ${Math.max(60, taskWidth)}px;">
                        ${task.title}
                        <div class="gantt-progress-track">
                            <div class="gantt-progress-fill" style="width: ${taskProgress}%;"></div>
                        </div>
                    </div>
                </div>
            `
        })
    })

    // 미분류 태스크 (마일스톤 없는)
    const orphanTasks = tasks.filter(t => !t.milestoneId)
    if (orphanTasks.length > 0) {
        const colorClass = 'orange'

        taskListHtml += `
            <div class="gantt-task-group expanded" data-milestone="orphan">
                <div class="gantt-group-title">
                    <span class="gantt-group-icon ${colorClass}"></span>
                    미분류
                    <span class="gantt-expand-icon">▶</span>
                </div>
        `

        orphanTasks.forEach(task => {
            const statusClass = task.status === 'completed' ? 'done' : task.status === 'in_progress' ? 'progress' : 'pending'
            taskListHtml += `
                <div class="gantt-task-item" data-task="${task.id}">
                    <span class="gantt-task-status ${statusClass}"></span>
                    ${task.title}
                </div>
            `
        })

        taskListHtml += '</div>'

        // 미분류 그룹 행
        timelineRowsHtml += `
            <div class="gantt-timeline-row group-row">
                ${months.map(() => '<div class="gantt-timeline-cell"></div>').join('')}
                <div class="gantt-bar ${colorClass}" style="left: 20px; width: 80px;">
                    미분류
                </div>
            </div>
        `

        orphanTasks.forEach(task => {
            const taskStart = task.startDate ? new Date(task.startDate) : minDate
            const taskEnd = task.endDate ? new Date(task.endDate) : taskStart
            const taskStartOffset = Math.max(0, (taskStart - minDate) / (1000 * 60 * 60 * 24))
            const taskDuration = Math.max(1, (taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1)
            const taskLeft = (taskStartOffset / totalDays) * (months.length * columnWidth)
            const taskWidth = (taskDuration / totalDays) * (months.length * columnWidth)
            const taskProgress = task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0

            timelineRowsHtml += `
                <div class="gantt-timeline-row" data-task="${task.id}">
                    ${months.map(() => '<div class="gantt-timeline-cell"></div>').join('')}
                    <div class="gantt-bar ${colorClass} task-bar" style="left: ${taskLeft}px; width: ${Math.max(60, taskWidth)}px;">
                        ${task.title}
                        <div class="gantt-progress-track">
                            <div class="gantt-progress-fill" style="width: ${taskProgress}%;"></div>
                        </div>
                    </div>
                </div>
            `
        })
    }

    taskListHtml += '</div>'

    // 오늘 표시선 계산
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let todayLineHtml = ''
    if (today >= minDate && today <= maxDate) {
        const todayOffset = (today - minDate) / (1000 * 60 * 60 * 24)
        const todayLeft = (todayOffset / totalDays) * (months.length * columnWidth)
        todayLineHtml = `<div class="gantt-today-line" style="left: ${todayLeft}px;"></div>`
    }

    // 범례 HTML
    const usedColors = new Set()
    milestones.forEach((_, i) => usedColors.add(colorPalette[i % colorPalette.length]))
    if (orphanTasks.length > 0) usedColors.add('orange')

    let legendHtml = '<div class="gantt-legend">'
    milestones.forEach((milestone, i) => {
        const colorClass = colorPalette[i % colorPalette.length]
        legendHtml += `
            <div class="gantt-legend-item">
                <span class="gantt-legend-color ${colorClass}"></span>
                ${milestone.title}
            </div>
        `
    })
    if (orphanTasks.length > 0) {
        legendHtml += `
            <div class="gantt-legend-item">
                <span class="gantt-legend-color orange"></span>
                미분류
            </div>
        `
    }
    legendHtml += `
        <div class="gantt-legend-item">
            <span class="gantt-legend-milestone"></span>
            마일스톤
        </div>
        <div class="gantt-legend-item">
            <span class="gantt-legend-today"></span>
            오늘
        </div>
    </div>`

    // 최종 HTML 조합
    container.innerHTML = `
        <div class="gantt-card">
            <div class="gantt-toolbar">
                <button class="btn gantt-add-milestone-btn">
                    <span>+</span> 마일스톤 추가
                </button>
                <div class="gantt-zoom">
                    <button class="zoom-btn ${ganttZoom === 'week' ? 'active' : ''}" data-zoom="week">주</button>
                    <button class="zoom-btn ${ganttZoom === 'month' ? 'active' : ''}" data-zoom="month">월</button>
                    <button class="zoom-btn ${ganttZoom === 'quarter' ? 'active' : ''}" data-zoom="quarter">분기</button>
                </div>
            </div>
            <div class="gantt-wrapper">
                ${taskListHtml}
                <div class="gantt-timeline">
                    <div class="gantt-timeline-header">
                        ${months.map(m => `
                            <div class="gantt-month-column">
                                <div class="gantt-month-year">${m.year}</div>
                                <div class="gantt-month-name">${m.name}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="gantt-timeline-body">
                        ${todayLineHtml}
                        ${timelineRowsHtml}
                    </div>
                </div>
            </div>
            ${legendHtml}
        </div>
    `

    // 줌 버튼 이벤트 재설정
    container.querySelectorAll('.zoom-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            ganttZoom = btn.dataset.zoom
            renderGanttChart()
        })
    })

    // 그룹 접기/펴기 이벤트
    container.querySelectorAll('.gantt-group-title').forEach(title => {
        title.addEventListener('click', () => {
            const group = title.closest('.gantt-task-group')
            const isExpanded = group.classList.toggle('expanded')

            // 타임라인 쪽 행도 함께 숨기기/보이기
            const taskItems = group.querySelectorAll('.gantt-task-item')
            taskItems.forEach(item => {
                const taskId = item.dataset.task
                const timelineRow = container.querySelector(`.gantt-timeline-row[data-task="${taskId}"]`)
                if (timelineRow) {
                    timelineRow.classList.toggle('hidden', !isExpanded)
                }
            })
        })
    })

    // 마일스톤 추가 버튼 이벤트
    container.querySelectorAll('.gantt-add-milestone-btn').forEach(btn => {
        btn.addEventListener('click', () => openMilestoneModal())
    })
}

// 태스크 탭 렌더링
function renderTasks() {
    const tasks = getTasks()
    const milestones = getMilestones()
    const body = document.getElementById('tasksBody')

    // 마일스톤 필터 드롭다운
    const filterSelect = document.getElementById('taskMilestoneFilter')
    filterSelect.innerHTML = `
        <option value="all">모든 마일스톤</option>
        ${milestones.map(m => `<option value="${m.id}">${m.title}</option>`).join('')}
        <option value="none">미분류</option>
    `

    // 필터 적용
    const filterValue = filterSelect.value
    let filteredTasks = tasks
    if (filterValue === 'none') {
        filteredTasks = tasks.filter(t => !t.milestoneId)
    } else if (filterValue !== 'all') {
        filteredTasks = tasks.filter(t => t.milestoneId === filterValue)
    }

    if (filteredTasks.length === 0) {
        body.innerHTML = '<div class="tasks-empty">태스크가 없습니다.</div>'
        return
    }

    body.innerHTML = filteredTasks.map(task => {
        const statusClass = task.status === 'completed' ? 'completed' : task.status === 'in_progress' ? 'in-progress' : 'pending'
        const statusText = task.status === 'completed' ? '완료' : task.status === 'in_progress' ? '진행중' : '대기'
        const priorityClass = task.priority || 'medium'
        const priorityText = task.priority === 'high' ? '높음' : task.priority === 'low' ? '낮음' : '보통'

        return `
            <div class="task-row" data-id="${task.id}">
                <span class="col-status">
                    <select class="status-select ${statusClass}" data-id="${task.id}">
                        <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>대기</option>
                        <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>진행중</option>
                        <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>완료</option>
                    </select>
                </span>
                <span class="col-title">${task.title}</span>
                <span class="col-assignee">${task.assignee?.name || task.assignee?.email || '-'}</span>
                <span class="col-date">${task.startDate || '-'} ~ ${task.endDate || '-'}</span>
                <span class="col-priority"><span class="priority-badge ${priorityClass}">${priorityText}</span></span>
                <span class="col-actions">
                    <button class="btn-icon edit-task-btn" data-id="${task.id}" title="수정">✏️</button>
                    <button class="btn-icon delete-task-btn" data-id="${task.id}" title="삭제">🗑️</button>
                </span>
            </div>
        `
    }).join('')

    // 상태 변경 이벤트
    body.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const taskId = e.target.dataset.id
            await updateTask(currentProjectId, taskId, { status: e.target.value })
        })
    })

    // 수정 버튼 이벤트
    body.querySelectorAll('.edit-task-btn').forEach(btn => {
        btn.addEventListener('click', () => openTaskModal(btn.dataset.id))
    })

    // 삭제 버튼 이벤트
    body.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('태스크를 삭제하시겠습니까?')) {
                await deleteTask(currentProjectId, btn.dataset.id)
            }
        })
    })
}

// 팀원 탭 렌더링
function renderMembers() {
    const project = getProjectById(currentProjectId)
    if (!project) return

    const members = project.members || []
    const user = getCurrentUser()
    const list = document.getElementById('membersList')

    if (members.length === 0) {
        list.innerHTML = '<div class="members-empty">팀원이 없습니다.</div>'
        return
    }

    list.innerHTML = members.map(member => {
        const isOwner = member.role === 'owner'
        const isMe = member.uid === user?.uid || member.email === user?.email
        const roleText = member.role === 'owner' ? '소유자' : member.role === 'member' ? '멤버' : '뷰어'

        return `
            <div class="member-item">
                <div class="member-info">
                    <div class="member-name">${member.name || member.email}</div>
                    <div class="member-email">${member.email}</div>
                </div>
                <div class="member-role">
                    <span class="role-badge ${member.role}">${roleText}</span>
                </div>
                <div class="member-actions">
                    ${!isOwner && !isMe ? `
                        <select class="role-change-select" data-email="${member.email}">
                            <option value="member" ${member.role === 'member' ? 'selected' : ''}>멤버</option>
                            <option value="viewer" ${member.role === 'viewer' ? 'selected' : ''}>뷰어</option>
                        </select>
                        <button class="btn-icon remove-member-btn" data-email="${member.email}" title="제거">❌</button>
                    ` : isMe ? '(나)' : ''}
                </div>
            </div>
        `
    }).join('')

    // 역할 변경 이벤트
    list.querySelectorAll('.role-change-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            await updateMemberRole(currentProjectId, e.target.dataset.email, e.target.value)
        })
    })

    // 멤버 제거 이벤트
    list.querySelectorAll('.remove-member-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('이 팀원을 제거하시겠습니까?')) {
                await removeProjectMember(currentProjectId, btn.dataset.email)
            }
        })
    })
}

// 프로젝트 모달 열기
function openProjectModal(projectId = null) {
    editingProjectId = projectId
    const modal = document.getElementById('projectModal')
    const title = document.getElementById('projectModalTitle')
    const confirmBtn = document.getElementById('projectConfirmBtn')

    if (projectId) {
        const project = getProjectById(projectId)
        if (!project) return

        title.textContent = '프로젝트 수정'
        confirmBtn.textContent = '수정'
        document.getElementById('projectName').value = project.title
        document.getElementById('projectDesc').value = project.description || ''
        document.getElementById('projectStartDate').value = project.startDate || ''
        document.getElementById('projectEndDate').value = project.endDate || ''
    } else {
        title.textContent = '새 프로젝트'
        confirmBtn.textContent = '만들기'
        document.getElementById('projectName').value = ''
        document.getElementById('projectDesc').value = ''
        document.getElementById('projectStartDate').value = ''
        document.getElementById('projectEndDate').value = ''
    }

    modal.style.display = 'flex'
}

// 마일스톤 모달 열기
function openMilestoneModal(milestoneId = null) {
    editingMilestoneId = milestoneId
    const modal = document.getElementById('milestoneModal')
    const title = document.getElementById('milestoneModalTitle')
    const confirmBtn = document.getElementById('milestoneConfirmBtn')

    if (milestoneId) {
        const milestones = getMilestones()
        const milestone = milestones.find(m => m.id === milestoneId)
        if (!milestone) return

        title.textContent = '마일스톤 수정'
        confirmBtn.textContent = '수정'
        document.getElementById('milestoneName').value = milestone.title
        document.getElementById('milestoneStartDate').value = milestone.startDate || ''
        document.getElementById('milestoneEndDate').value = milestone.endDate || ''

        // 색상 선택
        document.querySelectorAll('#milestoneColorSelect .color-option').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.color === milestone.color)
        })
    } else {
        title.textContent = '마일스톤 추가'
        confirmBtn.textContent = '추가'
        document.getElementById('milestoneName').value = ''
        document.getElementById('milestoneStartDate').value = ''
        document.getElementById('milestoneEndDate').value = ''

        document.querySelectorAll('#milestoneColorSelect .color-option').forEach((btn, i) => {
            btn.classList.toggle('selected', i === 0)
        })
    }

    modal.style.display = 'flex'
}

// 태스크 모달 열기
function openTaskModal(taskId = null) {
    editingTaskId = taskId
    const modal = document.getElementById('taskModal')
    const title = document.getElementById('taskModalTitle')
    const confirmBtn = document.getElementById('taskConfirmBtn')
    const milestones = getMilestones()
    const project = getProjectById(currentProjectId)

    // 마일스톤 드롭다운
    const milestoneSelect = document.getElementById('taskMilestone')
    milestoneSelect.innerHTML = `
        <option value="">없음</option>
        ${milestones.map(m => `<option value="${m.id}">${m.title}</option>`).join('')}
    `

    // 담당자 드롭다운 (프로젝트 멤버)
    const assigneeSelect = document.getElementById('taskAssignee')
    const members = project?.members || []
    assigneeSelect.innerHTML = `
        <option value="">미지정</option>
        ${members.map(m => `<option value="${m.email}">${m.name || m.email}</option>`).join('')}
    `

    if (taskId) {
        const tasks = getTasks()
        const task = tasks.find(t => t.id === taskId)
        if (!task) return

        title.textContent = '태스크 수정'
        confirmBtn.textContent = '수정'
        document.getElementById('taskName').value = task.title
        document.getElementById('taskMilestone').value = task.milestoneId || ''
        document.getElementById('taskAssignee').value = task.assignee?.email || ''
        document.getElementById('taskStartDate').value = task.startDate || ''
        document.getElementById('taskEndDate').value = task.endDate || ''

        // 우선순위 선택
        document.querySelectorAll('#taskPrioritySelect .priority-option').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.priority === task.priority)
        })
    } else {
        title.textContent = '태스크 추가'
        confirmBtn.textContent = '추가'
        document.getElementById('taskName').value = ''
        document.getElementById('taskMilestone').value = ''
        document.getElementById('taskAssignee').value = ''
        document.getElementById('taskStartDate').value = ''
        document.getElementById('taskEndDate').value = ''

        document.querySelectorAll('#taskPrioritySelect .priority-option').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.priority === 'medium')
        })
    }

    modal.style.display = 'flex'
}

// 멤버 추가 모달 열기
function openMemberModal() {
    const modal = document.getElementById('memberModal')
    const project = getProjectById(currentProjectId)
    const existingEmails = (project?.members || []).map(m => m.email)
    const allEmails = getAllowedEmails()

    // 추가 가능한 이메일 (기존 멤버 제외)
    const availableEmails = allEmails.filter(email => !existingEmails.includes(email))

    const emailSelect = document.getElementById('memberEmail')
    emailSelect.innerHTML = `
        <option value="">이메일 선택...</option>
        ${availableEmails.map(email => `<option value="${email}">${email}</option>`).join('')}
    `

    // 역할 선택 초기화
    document.querySelectorAll('#memberRoleSelect .role-option').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.role === 'member')
    })

    modal.style.display = 'flex'
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 로그인/로그아웃
    document.getElementById('googleLoginBtn').addEventListener('click', async () => {
        const { loginWithGoogle } = await import('./services/auth-service.js')
        await loginWithGoogle()
    })

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        const { logout } = await import('./services/auth-service.js')
        await logout()
    })

    // 새 프로젝트 버튼
    document.getElementById('newProjectBtn').addEventListener('click', () => openProjectModal())

    // 목록으로 돌아가기
    document.getElementById('backToListBtn').addEventListener('click', backToList)

    // 프로젝트 편집/삭제
    document.getElementById('editProjectBtn').addEventListener('click', () => openProjectModal(currentProjectId))
    document.getElementById('deleteProjectBtn').addEventListener('click', async () => {
        if (confirm('프로젝트를 삭제하시겠습니까? 모든 마일스톤과 태스크도 삭제됩니다.')) {
            await deleteProject(currentProjectId)
            backToList()
        }
    })

    // 탭 전환
    document.querySelectorAll('.detail-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab))
    })

    // 필터 버튼
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
            btn.classList.add('active')
            currentFilter = btn.dataset.filter
            renderProjectList(getProjects())
        })
    })

    // 태스크 추가
    document.getElementById('addTaskBtn').addEventListener('click', () => openTaskModal())

    // 태스크 마일스톤 필터
    document.getElementById('taskMilestoneFilter').addEventListener('change', renderTasks)

    // 멤버 추가
    document.getElementById('addMemberBtn').addEventListener('click', openMemberModal)

    // === 모달 이벤트 ===

    // 프로젝트 모달
    document.getElementById('projectModalCloseBtn').addEventListener('click', () => {
        document.getElementById('projectModal').style.display = 'none'
    })

    document.getElementById('projectConfirmBtn').addEventListener('click', async () => {
        const title = document.getElementById('projectName').value.trim()
        const description = document.getElementById('projectDesc').value.trim()
        const startDate = document.getElementById('projectStartDate').value
        const endDate = document.getElementById('projectEndDate').value

        if (!title) {
            alert('프로젝트 이름을 입력하세요.')
            return
        }

        if (editingProjectId) {
            await updateProject(editingProjectId, { title, description, startDate, endDate })
        } else {
            const newId = await createProject({ title, description, startDate, endDate })
            if (newId) {
                showProjectDetail(newId)
            }
        }

        document.getElementById('projectModal').style.display = 'none'
    })

    // 마일스톤 모달
    document.querySelectorAll('#milestoneColorSelect .color-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#milestoneColorSelect .color-option').forEach(b => b.classList.remove('selected'))
            btn.classList.add('selected')
        })
    })

    document.getElementById('milestoneModalCloseBtn').addEventListener('click', () => {
        document.getElementById('milestoneModal').style.display = 'none'
    })

    document.getElementById('milestoneConfirmBtn').addEventListener('click', async () => {
        const title = document.getElementById('milestoneName').value.trim()
        const startDate = document.getElementById('milestoneStartDate').value
        const endDate = document.getElementById('milestoneEndDate').value
        const color = document.querySelector('#milestoneColorSelect .color-option.selected')?.dataset.color || '#238636'

        if (!title) {
            alert('마일스톤 이름을 입력하세요.')
            return
        }

        if (editingMilestoneId) {
            await updateMilestone(currentProjectId, editingMilestoneId, { title, startDate, endDate, color })
        } else {
            await createMilestone(currentProjectId, { title, startDate, endDate, color })
        }

        document.getElementById('milestoneModal').style.display = 'none'
    })

    // 태스크 모달
    document.querySelectorAll('#taskPrioritySelect .priority-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#taskPrioritySelect .priority-option').forEach(b => b.classList.remove('selected'))
            btn.classList.add('selected')
        })
    })

    document.getElementById('taskModalCloseBtn').addEventListener('click', () => {
        document.getElementById('taskModal').style.display = 'none'
    })

    document.getElementById('taskConfirmBtn').addEventListener('click', async () => {
        const title = document.getElementById('taskName').value.trim()
        const milestoneId = document.getElementById('taskMilestone').value || null
        const assigneeEmail = document.getElementById('taskAssignee').value
        const startDate = document.getElementById('taskStartDate').value
        const endDate = document.getElementById('taskEndDate').value
        const priority = document.querySelector('#taskPrioritySelect .priority-option.selected')?.dataset.priority || 'medium'

        if (!title) {
            alert('태스크 이름을 입력하세요.')
            return
        }

        // 담당자 정보
        let assignee = null
        if (assigneeEmail) {
            const project = getProjectById(currentProjectId)
            const member = project?.members?.find(m => m.email === assigneeEmail)
            assignee = member ? { uid: member.uid, email: member.email, name: member.name } : { email: assigneeEmail }
        }

        if (editingTaskId) {
            await updateTask(currentProjectId, editingTaskId, { title, milestoneId, assignee, startDate, endDate, priority })
        } else {
            await createTask(currentProjectId, { title, milestoneId, assignee, startDate, endDate, priority })
        }

        document.getElementById('taskModal').style.display = 'none'
    })

    // 멤버 모달
    document.querySelectorAll('#memberRoleSelect .role-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#memberRoleSelect .role-option').forEach(b => b.classList.remove('selected'))
            btn.classList.add('selected')
        })
    })

    document.getElementById('memberModalCloseBtn').addEventListener('click', () => {
        document.getElementById('memberModal').style.display = 'none'
    })

    document.getElementById('memberConfirmBtn').addEventListener('click', async () => {
        const email = document.getElementById('memberEmail').value
        const role = document.querySelector('#memberRoleSelect .role-option.selected')?.dataset.role || 'member'

        if (!email) {
            alert('이메일을 선택하세요.')
            return
        }

        await addProjectMember(currentProjectId, { email, role })
        document.getElementById('memberModal').style.display = 'none'
    })

    // 모달 외부 클릭
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none'
            }
        })
    })

    // 브라우저 뒤로가기
    window.addEventListener('popstate', () => {
        const params = new URLSearchParams(window.location.search)
        const projectId = params.get('id')
        if (projectId) {
            showProjectDetail(projectId)
        } else {
            backToList()
        }
    })
}

// 앱 초기화
function initApp() {
    showLoading()

    setupEventListeners()

    // 프로젝트 콜백
    setProjectCallback((projects) => {
        renderProjectList(projects)

        // 현재 프로젝트 상세 보기 중이면 해당 탭도 업데이트 (실시간 반영)
        if (currentProjectId) {
            const project = getProjectById(currentProjectId)
            if (project) {
                // 제목 업데이트
                document.getElementById('projectDetailTitle').textContent = project.title

                // 현재 탭에 따라 업데이트
                if (currentTab === 'members') renderMembers()
                if (currentTab === 'overview') renderOverview()
            }
        }

        hideLoading()
    })

    // 마일스톤 콜백
    setMilestoneCallback(() => {
        if (currentTab === 'overview') renderOverview()
        if (currentTab === 'gantt') renderGanttChart()
        if (currentTab === 'tasks') renderTasks()
    })

    // 태스크 콜백
    setTaskCallback(() => {
        if (currentTab === 'overview') renderOverview()
        if (currentTab === 'gantt') renderGanttChart()
        if (currentTab === 'tasks') renderTasks()
    })

    // 이메일 콜백
    setAllowedEmailsCallback(() => {
        // 멤버 추가 드롭다운 업데이트
    })

    // 인증 상태 콜백
    setAuthStateCallback((user) => {
        if (user) {
            showAppScreen(user)
            setupProjectsListener()
            setupPermissionListener()
            setupAllowedEmailsListener()

            // URL 파라미터 체크
            const params = new URLSearchParams(window.location.search)
            const projectId = params.get('id')
            if (projectId) {
                // 프로젝트 로드 후 상세 보기
                setTimeout(() => showProjectDetail(projectId), 500)
            }
        } else {
            removeProjectsListener()
            removeProjectDetailListener()
            removePermissionListener()
            removeAllowedEmailsListener()
            showAuthScreen()
            hideLoading()
        }
    })

    initAuthListener()
}

document.addEventListener('DOMContentLoaded', initApp)
