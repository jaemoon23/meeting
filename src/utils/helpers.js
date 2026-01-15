export function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

export function formatTime(dateString) {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export function groupByDate(meetings) {
    const groups = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    meetings.forEach(meeting => {
        const date = new Date(meeting.updatedAt)
        date.setHours(0, 0, 0, 0)

        let groupKey
        if (date.getTime() === today.getTime()) {
            groupKey = '오늘'
        } else if (date.getTime() === yesterday.getTime()) {
            groupKey = '어제'
        } else if (date > weekAgo) {
            groupKey = '이번 주'
        } else if (date > monthAgo) {
            groupKey = '이번 달'
        } else {
            groupKey = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
        }

        if (!groups[groupKey]) {
            groups[groupKey] = []
        }
        groups[groupKey].push(meeting)
    })

    return groups
}

export function sortDateGroups(groups) {
    const groupOrder = ['오늘', '어제', '이번 주', '이번 달']

    return Object.keys(groups).sort((a, b) => {
        const aIndex = groupOrder.indexOf(a)
        const bIndex = groupOrder.indexOf(b)
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
        return b.localeCompare(a)
    })
}

export function showLoading() {
    document.getElementById('loadingOverlay').classList.add('show')
}

export function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show')
}

export function updateSyncStatus(status) {
    const el = document.getElementById('syncStatus')
    el.className = 'sync-status'
    switch (status) {
        case 'connected':
            el.textContent = '실시간 동기화'
            break
        case 'offline':
            el.classList.add('offline')
            el.textContent = '오프라인'
            break
        case 'syncing':
            el.classList.add('syncing')
            el.textContent = '동기화 중...'
            break
        default:
            el.textContent = '연결 중...'
    }
}
