import { escapeHtml, formatTime, groupByDate, sortDateGroups } from '../utils/helpers.js'
import { getCategories, getFilteredMeetings } from '../services/category-service.js'
import { deleteMeeting } from '../services/meeting-service.js'

let currentMeetingId = null
let currentFilter = '전체'
let searchQuery = ''
let onMeetingSelectCallback = null
let onMeetingDeleteCallback = null

export function getCurrentMeetingId() {
    return currentMeetingId
}

export function setCurrentMeetingId(id) {
    currentMeetingId = id
}

export function getCurrentFilter() {
    return currentFilter
}

export function setOnMeetingSelectCallback(callback) {
    onMeetingSelectCallback = callback
}

export function setOnMeetingDeleteCallback(callback) {
    onMeetingDeleteCallback = callback
}

export function renderCategoryTabs(meetings) {
    const container = document.getElementById('categoryTabs')
    const categories = getCategories()

    const categoryCounts = { '전체': meetings.length }
    meetings.forEach(m => {
        const cat = m.category || '미분류'
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    })

    container.innerHTML = categories.map(cat => `
        <button class="category-tab ${cat === currentFilter ? 'active' : ''}"
                data-category="${cat}">
            ${cat}<span class="count">(${categoryCounts[cat] || 0})</span>
        </button>
    `).join('')

    container.querySelectorAll('.category-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.category
            renderCategoryTabs(meetings)
            renderMeetingList()
        })
    })
}

export function renderMeetingList() {
    const container = document.getElementById('meetingListContainer')
    const filteredMeetings = getFilteredMeetings(currentFilter, searchQuery)

    if (filteredMeetings.length === 0) {
        if (searchQuery) {
            container.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <div>"${escapeHtml(searchQuery)}" 검색 결과가 없습니다</div>
                </div>
            `
        } else {
            container.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">📝</div>
                    <div>저장된 회의록이 없습니다</div>
                </div>
            `
        }
        return
    }

    const groups = groupByDate(filteredMeetings)
    const sortedKeys = sortDateGroups(groups)

    let html = ''

    sortedKeys.forEach(groupKey => {
        html += `
            <div class="date-group">
                <div class="date-group-header">📅 ${groupKey}</div>
                <ul class="meeting-list">
                    ${groups[groupKey].map(meeting => `
                        <li class="meeting-item ${meeting.id === currentMeetingId ? 'active' : ''}"
                            data-id="${meeting.id}">
                            <div class="meeting-item-info">
                                <div class="meeting-item-title">${escapeHtml(meeting.title)}</div>
                                <div class="meeting-item-meta">
                                    <span class="meeting-item-date">${formatTime(meeting.updatedAt)}</span>
                                    ${meeting.category ? `<span class="meeting-item-category">${escapeHtml(meeting.category)}</span>` : ''}
                                </div>
                            </div>
                            <button class="meeting-item-delete" data-id="${meeting.id}">🗑️</button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `
    })

    container.innerHTML = html

    container.querySelectorAll('.meeting-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('meeting-item-delete')) {
                const id = item.dataset.id
                currentMeetingId = id
                renderMeetingList()
                if (onMeetingSelectCallback) {
                    onMeetingSelectCallback(id)
                }
            }
        })
    })

    container.querySelectorAll('.meeting-item-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation()
            const id = btn.dataset.id
            if (confirm('정말 삭제하시겠습니까? 모든 팀원에게서 삭제됩니다.')) {
                await deleteMeeting(id)
                if (currentMeetingId === id) {
                    currentMeetingId = null
                    if (onMeetingDeleteCallback) {
                        onMeetingDeleteCallback()
                    }
                }
            }
        })
    })
}

export function setupSearch() {
    const searchInput = document.getElementById('searchInput')
    const searchClear = document.getElementById('searchClear')

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase()
        searchClear.classList.toggle('show', searchQuery.length > 0)
        renderMeetingList()
    })

    searchClear.addEventListener('click', () => {
        searchInput.value = ''
        searchQuery = ''
        searchClear.classList.remove('show')
        renderMeetingList()
    })
}
