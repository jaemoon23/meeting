import { escapeHtml, formatTime } from '../utils/helpers.js'
import { getCurrentUser } from '../services/auth-service.js'
import { createComment, deleteComment, setupCommentsListener, removeCommentsListener } from '../services/comment-service.js'
import { getAllowedEmails } from '../services/allowed-emails-service.js'
import { getDiscordMappings } from '../services/discord-mapping-service.js'

let currentMeetingId = null
let mentionDropdownVisible = false
let mentionStartIndex = -1

// 댓글 섹션 초기화
export function initCommentsSection(meetingId) {
    currentMeetingId = meetingId

    if (!meetingId) {
        removeCommentsListener()
        const container = document.getElementById('commentsSection')
        if (container) {
            container.style.display = 'none'
        }
        return
    }

    const container = document.getElementById('commentsSection')
    if (container) {
        container.style.display = 'block'
    }

    setupCommentsListener(meetingId, renderComments)
    setupCommentInput()
}

// 댓글 입력 셋업
function setupCommentInput() {
    const input = document.getElementById('commentInput')
    const submitBtn = document.getElementById('commentSubmitBtn')

    if (!input || !submitBtn) return

    // 기존 이벤트 리스너 제거 (중복 방지)
    const newInput = input.cloneNode(true)
    input.parentNode.replaceChild(newInput, input)
    const newSubmitBtn = submitBtn.cloneNode(true)
    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn)

    // 새 이벤트 리스너 추가
    newInput.addEventListener('input', handleCommentInput)
    newInput.addEventListener('keydown', handleCommentKeydown)
    newSubmitBtn.addEventListener('click', handleCommentSubmit)
}

// 댓글 입력 핸들러 (멘션 자동완성)
function handleCommentInput(e) {
    const input = e.target
    const value = input.value
    const cursorPos = input.selectionStart

    // @ 문자 찾기
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
        // 공백이 없으면 멘션 중
        if (!textAfterAt.includes(' ')) {
            mentionStartIndex = lastAtIndex
            showMentionDropdown(textAfterAt.toLowerCase(), input)
            return
        }
    }

    hideMentionDropdown()
}

// 키보드 이벤트 핸들러
function handleCommentKeydown(e) {
    const dropdown = document.getElementById('mentionDropdown')

    if (mentionDropdownVisible && dropdown) {
        const items = dropdown.querySelectorAll('.mention-item')
        const activeItem = dropdown.querySelector('.mention-item.active')
        let activeIndex = Array.from(items).indexOf(activeItem)

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (activeIndex < items.length - 1) {
                items[activeIndex]?.classList.remove('active')
                items[activeIndex + 1]?.classList.add('active')
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (activeIndex > 0) {
                items[activeIndex]?.classList.remove('active')
                items[activeIndex - 1]?.classList.add('active')
            }
        } else if (e.key === 'Enter' && activeItem) {
            e.preventDefault()
            selectMention(activeItem.dataset.email)
        } else if (e.key === 'Escape') {
            hideMentionDropdown()
        }
    } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleCommentSubmit()
    }
}

// 멘션 드롭다운 표시
function showMentionDropdown(query, input) {
    let dropdown = document.getElementById('mentionDropdown')

    if (!dropdown) {
        dropdown = document.createElement('div')
        dropdown.id = 'mentionDropdown'
        dropdown.className = 'mention-dropdown'
        input.parentNode.appendChild(dropdown)
    }

    // 허용된 이메일과 Discord 매핑 정보
    const allowedEmails = getAllowedEmails()
    const discordMappings = getDiscordMappings()

    // 이메일 필터링
    const filteredEmails = allowedEmails.filter(email =>
        email && email.toLowerCase().includes(query)
    ).slice(0, 5)

    if (filteredEmails.length === 0) {
        hideMentionDropdown()
        return
    }

    // 이름 정보 가져오기
    const getDisplayName = (email) => {
        const mapping = Object.values(discordMappings).find(m => m.email === email)
        return mapping?.displayName || email.split('@')[0]
    }

    dropdown.innerHTML = filteredEmails.map((email, index) => `
        <div class="mention-item ${index === 0 ? 'active' : ''}" data-email="${email}">
            <span class="mention-name">${escapeHtml(getDisplayName(email))}</span>
            <span class="mention-email">${escapeHtml(email)}</span>
        </div>
    `).join('')

    dropdown.querySelectorAll('.mention-item').forEach(item => {
        item.addEventListener('click', () => {
            selectMention(item.dataset.email)
        })
    })

    dropdown.style.display = 'block'
    mentionDropdownVisible = true
}

// 멘션 드롭다운 숨기기
function hideMentionDropdown() {
    const dropdown = document.getElementById('mentionDropdown')
    if (dropdown) {
        dropdown.style.display = 'none'
    }
    mentionDropdownVisible = false
    mentionStartIndex = -1
}

// 멘션 선택
function selectMention(email) {
    const input = document.getElementById('commentInput')
    if (!input || mentionStartIndex === -1) return

    const value = input.value
    const before = value.substring(0, mentionStartIndex)
    const after = value.substring(input.selectionStart)

    input.value = `${before}@${email} ${after}`
    input.focus()

    // 커서 위치 조정
    const newCursorPos = before.length + email.length + 2
    input.setSelectionRange(newCursorPos, newCursorPos)

    hideMentionDropdown()
}

// 댓글 제출
async function handleCommentSubmit() {
    const input = document.getElementById('commentInput')
    if (!input || !currentMeetingId) return

    const content = input.value.trim()
    if (!content) return

    input.disabled = true
    const submitBtn = document.getElementById('commentSubmitBtn')
    if (submitBtn) submitBtn.disabled = true

    try {
        await createComment(currentMeetingId, content)
        input.value = ''
    } catch (error) {
        console.error('댓글 작성 실패:', error)
        alert('댓글 작성에 실패했습니다.')
    } finally {
        input.disabled = false
        if (submitBtn) submitBtn.disabled = false
        input.focus()
    }
}

// 댓글 목록 렌더링
function renderComments(comments) {
    const container = document.getElementById('commentsList')
    if (!container) return

    const user = getCurrentUser()

    if (comments.length === 0) {
        container.innerHTML = `
            <div class="comments-empty">
                아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
            </div>
        `
        return
    }

    container.innerHTML = comments.map(comment => {
        const isAuthor = user?.uid === comment.authorUid
        const formattedContent = formatCommentContent(comment.content)

        return `
            <div class="comment-item ${isAuthor ? 'own-comment' : ''}">
                <div class="comment-header">
                    <span class="comment-author">${escapeHtml(comment.authorName)}</span>
                    <span class="comment-time">${formatTime(comment.createdAt)}</span>
                    ${isAuthor ? `<button class="comment-delete-btn" data-id="${comment.id}">삭제</button>` : ''}
                </div>
                <div class="comment-content">${formattedContent}</div>
            </div>
        `
    }).join('')

    // 삭제 버튼 이벤트
    container.querySelectorAll('.comment-delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('댓글을 삭제하시겠습니까?')) {
                const commentId = btn.dataset.id
                await deleteComment(currentMeetingId, commentId)
            }
        })
    })

    // 스크롤 맨 아래로
    container.scrollTop = container.scrollHeight
}

// 댓글 내용 포맷팅 (멘션 하이라이팅)
function formatCommentContent(content) {
    const escaped = escapeHtml(content)
    // @이메일 형태의 멘션을 하이라이팅
    return escaped.replace(/@(\S+@\S+\.\S+)/g, '<span class="mention-highlight">@$1</span>')
}

// 댓글 섹션 정리
export function cleanupCommentsSection() {
    removeCommentsListener()
    currentMeetingId = null
    hideMentionDropdown()
}
