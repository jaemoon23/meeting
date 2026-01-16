import { db } from '../lib/firebase.js'
import { ref, push, set, remove, onValue, off, get } from 'firebase/database'
import { getCurrentUser } from './auth-service.js'
import { getDiscordIdByEmail } from './discord-mapping-service.js'
import { sendMentionNotification, sendCommentNotification } from './discord-webhook-service.js'
import { getMeetingById } from './meeting-service.js'

let currentCommentsRef = null
let commentsCallback = null

// 댓글 리스너 설정
export function setupCommentsListener(meetingId, callback) {
    // 기존 리스너 정리
    removeCommentsListener()

    if (!meetingId) return

    commentsCallback = callback
    currentCommentsRef = ref(db, `comments/${meetingId}`)

    onValue(currentCommentsRef, (snapshot) => {
        const data = snapshot.val()
        const comments = data
            ? Object.entries(data).map(([id, comment]) => ({ id, ...comment }))
            : []

        // 시간순 정렬 (오래된 것이 위에)
        comments.sort((a, b) => a.createdAt - b.createdAt)

        if (commentsCallback) {
            commentsCallback(comments)
        }
    })
}

// 댓글 리스너 제거
export function removeCommentsListener() {
    if (currentCommentsRef) {
        off(currentCommentsRef)
        currentCommentsRef = null
    }
    commentsCallback = null
}

// @이메일 멘션 파싱
export function parseMentions(content) {
    const regex = /@(\S+@\S+\.\S+)/g
    const mentions = []
    let match

    while ((match = regex.exec(content)) !== null) {
        const email = match[1]
        const discordId = getDiscordIdByEmail(email)
        mentions.push({ email, discordId })
    }

    return mentions
}

// 댓글 작성
export async function createComment(meetingId, content) {
    const user = getCurrentUser()
    if (!user || !meetingId || !content.trim()) return null

    const mentions = parseMentions(content)

    const commentData = {
        authorUid: user.uid,
        authorEmail: user.email,
        authorName: user.displayName || user.email.split('@')[0],
        content: content.trim(),
        mentions,
        createdAt: Date.now()
    }

    const commentsRef = ref(db, `comments/${meetingId}`)
    const newCommentRef = push(commentsRef)
    await set(newCommentRef, commentData)

    const meeting = getMeetingById(meetingId)
    const meetingTitle = meeting?.title || '회의록'

    // Discord 알림 전송 - 일반 댓글 알림
    sendCommentNotification(meetingTitle, commentData)

    // Discord 알림 전송 - 멘션 알림 (멘션이 있는 경우)
    if (mentions.some(m => m.discordId)) {
        sendMentionNotification(meetingTitle, commentData)
    }

    return newCommentRef.key
}

// 댓글 삭제
export async function deleteComment(meetingId, commentId) {
    const user = getCurrentUser()
    if (!user || !meetingId || !commentId) return false

    // 권한 확인 (본인 댓글만 삭제 가능)
    const commentRef = ref(db, `comments/${meetingId}/${commentId}`)
    const snapshot = await get(commentRef)
    const comment = snapshot.val()

    if (!comment || comment.authorUid !== user.uid) {
        return false
    }

    await remove(commentRef)
    return true
}
