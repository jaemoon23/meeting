import { renderMarkdown } from '../lib/marked-config.js'
import { getMeetingById, updateMeetingContent, deleteMeeting } from '../services/meeting-service.js'
import { getCurrentMeetingId, setCurrentMeetingId } from './meeting-list.js'
import { initCommentsSection, cleanupCommentsSection } from './comments-ui.js'
import { canDeleteMeetings } from '../services/permission-service.js'

let currentTab = 'preview'

export function showEmptyState() {
    document.getElementById('emptyState').style.display = 'block'
    document.getElementById('contentView').style.display = 'none'
    cleanupCommentsSection()
}

export function showContentView(meeting) {
    document.getElementById('emptyState').style.display = 'none'
    document.getElementById('contentView').style.display = 'block'
    document.getElementById('contentTitle').textContent = meeting.title
    document.getElementById('contentCategory').textContent = meeting.category || '미분류'
    document.getElementById('editor').value = meeting.content
    document.getElementById('previewPane').innerHTML = renderMarkdown(meeting.content)
    switchTab('preview')
    initCommentsSection(meeting.id)

    // 삭제 버튼 표시 (권한 있을 때만)
    const deleteBtn = document.getElementById('deleteMeetingBtn')
    if (deleteBtn) {
        deleteBtn.style.display = canDeleteMeetings() ? 'inline-block' : 'none'
    }
}

export function updateContentView(meeting) {
    document.getElementById('contentTitle').textContent = meeting.title
    document.getElementById('contentCategory').textContent = meeting.category || '미분류'
    if (currentTab === 'preview') {
        document.getElementById('previewPane').innerHTML = renderMarkdown(meeting.content)
    }
}

export function switchTab(tab) {
    currentTab = tab

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab)
    })

    document.getElementById('previewPane').style.display = tab === 'preview' ? 'block' : 'none'
    document.getElementById('editPane').style.display = tab === 'edit' ? 'block' : 'none'

    if (tab === 'preview') {
        const content = document.getElementById('editor').value
        document.getElementById('previewPane').innerHTML = renderMarkdown(content)
    }
}

export async function saveCurrentMeeting() {
    const currentMeetingId = getCurrentMeetingId()
    if (!currentMeetingId) return

    const content = document.getElementById('editor').value

    try {
        await updateMeetingContent(currentMeetingId, content)
        document.getElementById('previewPane').innerHTML = renderMarkdown(content)
        alert('저장되었습니다!')
    } catch (error) {
        alert('저장에 실패했습니다.')
    }
}

export function exportMeeting() {
    const currentMeetingId = getCurrentMeetingId()
    if (!currentMeetingId) return

    const meeting = getMeetingById(currentMeetingId)
    const content = document.getElementById('editor').value

    if (meeting) {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${meeting.title}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }
}

export function setupEditor() {
    const previewTabBtn = document.getElementById('previewTabBtn')
    const editTabBtn = document.getElementById('editTabBtn')
    const saveBtn = document.getElementById('saveBtn')
    const exportBtn = document.getElementById('exportBtn')
    const deleteBtn = document.getElementById('deleteMeetingBtn')

    previewTabBtn.addEventListener('click', () => switchTab('preview'))
    editTabBtn.addEventListener('click', () => switchTab('edit'))
    saveBtn.addEventListener('click', saveCurrentMeeting)
    exportBtn.addEventListener('click', exportMeeting)

    // 삭제 버튼 이벤트
    deleteBtn?.addEventListener('click', async () => {
        const currentId = getCurrentMeetingId()
        if (!currentId) return

        if (!canDeleteMeetings()) {
            alert('회의록 삭제 권한이 없습니다.')
            return
        }

        if (confirm('정말 삭제하시겠습니까? 모든 팀원에게서 삭제됩니다.')) {
            await deleteMeeting(currentId)
            setCurrentMeetingId(null)
            showEmptyState()
        }
    })

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault()
            if (getCurrentMeetingId()) {
                saveCurrentMeeting()
            }
        }
    })
}
