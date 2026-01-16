import { db } from '../lib/firebase.js'
import { ref, get } from 'firebase/database'
import { getDiscordIdByEmail } from './discord-mapping-service.js'

// adminConfig에서 웹훅 URL 가져오기
export async function getWebhookUrl() {
    const configRef = ref(db, 'adminConfig/discordWebhook')
    const snapshot = await get(configRef)
    return snapshot.val() || null
}

// 멘션 알림 전송
export async function sendMentionNotification(meetingTitle, comment) {
    const webhookUrl = await getWebhookUrl()
    if (!webhookUrl) return false

    const discordMentions = comment.mentions
        .filter(m => m.discordId)
        .map(m => `<@${m.discordId}>`)
        .join(' ')

    if (!discordMentions) return false

    // 댓글 내용에서 @이메일 제거
    const cleanContent = comment.content.replace(/@\S+@\S+\.\S+/g, '').trim()

    const payload = {
        content: discordMentions,
        embeds: [{
            title: `[${meetingTitle}] 코멘트 할당`,
            description: cleanContent,
            color: 0x5865F2,
            author: {
                name: comment.authorName || comment.authorEmail
            },
            timestamp: new Date().toISOString()
        }]
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        return response.ok
    } catch (error) {
        console.error('Discord 알림 전송 실패:', error)
        return false
    }
}

// 테스트 메시지 전송
export async function sendTestMessage(webhookUrl, customTitle = null) {
    if (!webhookUrl) return false

    const title = customTitle || '회의록 관리 앱 - 테스트 알림'

    const payload = {
        content: '🔔 웹훅 연결 테스트',
        embeds: [{
            title: title,
            description: 'Discord 웹훅이 정상적으로 연결되었습니다!',
            color: 0x00D166,
            timestamp: new Date().toISOString()
        }]
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        return response.ok
    } catch (error) {
        console.error('테스트 메시지 전송 실패:', error)
        return false
    }
}

// 이메일로 Discord ID 조회 (멘션 파싱용)
export function resolveDiscordId(email) {
    return getDiscordIdByEmail(email)
}
