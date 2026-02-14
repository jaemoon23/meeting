import { db } from '../lib/firebase.js'
import { ref, get, onValue, off } from 'firebase/database'
import { getDiscordIdByEmail } from './discord-mapping-service.js'

// 사이트 기본 URL
const BASE_URL = 'https://jaemoon23.github.io/meeting'

// 웹훅 설정 캐시
let webhookConfig = {
    meeting: { url: '', options: {} },
    calendar: { url: '', options: {} },
    project: { url: '', options: {} }
}
let webhookConfigRef = null
let webhookConfigCallback = null

// 웹훅 설정 리스너 설정 (실시간 업데이트)
export function setupWebhookConfigListener(callback) {
    webhookConfigCallback = callback
    webhookConfigRef = ref(db, 'adminConfig/webhooks')

    onValue(webhookConfigRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
            webhookConfig = {
                meeting: data.meeting || { url: '', options: {} },
                calendar: data.calendar || { url: '', options: {} },
                project: data.project || { url: '', options: {} }
            }
        }
        if (webhookConfigCallback) {
            webhookConfigCallback(webhookConfig)
        }
    })
}

// 웹훅 설정 리스너 제거
export function removeWebhookConfigListener() {
    if (webhookConfigRef) {
        off(webhookConfigRef)
        webhookConfigRef = null
    }
    webhookConfigCallback = null
}

// 웹훅 설정 가져오기 (일회성)
export async function getWebhookConfig() {
    const configRef = ref(db, 'adminConfig/webhooks')
    const snapshot = await get(configRef)
    const data = snapshot.val()

    if (data) {
        webhookConfig = {
            meeting: data.meeting || { url: '', options: {} },
            calendar: data.calendar || { url: '', options: {} },
            project: data.project || { url: '', options: {} }
        }
    }

    return webhookConfig
}

// 특정 타입의 웹훅 URL 가져오기
export function getWebhookUrl(type) {
    return webhookConfig[type]?.url || null
}

// 특정 옵션이 활성화되어 있는지 확인
export function isOptionEnabled(type, option) {
    return webhookConfig[type]?.options?.[option] === true
}

// ============================================
// 회의록 관련 알림
// ============================================

// 새 회의록 생성 알림
export async function sendNewMeetingNotification(meeting, author, meetingId) {
    await ensureWebhookConfig()
    if (!isOptionEnabled('meeting', 'newMeeting')) return false

    const webhookUrl = getWebhookUrl('meeting')
    if (!webhookUrl) return false

    const meetingUrl = meetingId ? `${BASE_URL}/meetings.html?id=${meetingId}` : `${BASE_URL}/meetings.html`

    const payload = {
        embeds: [{
            title: '📝 새 회의록 생성',
            url: meetingUrl,
            description: meeting.title,
            color: 0x238636,
            fields: [
                { name: '카테고리', value: meeting.category || '미분류', inline: true },
                { name: '작성자', value: author, inline: true }
            ],
            timestamp: new Date().toISOString()
        }]
    }

    return await sendWebhook(webhookUrl, payload)
}

// 댓글 작성 알림
export async function sendCommentNotification(meetingTitle, comment, meetingId) {
    await ensureWebhookConfig()
    if (!isOptionEnabled('meeting', 'comment')) return false

    const webhookUrl = getWebhookUrl('meeting')
    if (!webhookUrl) return false

    // 댓글 내용에서 @이메일 제거
    const cleanContent = comment.content.replace(/@\S+@\S+\.\S+/g, '').trim()

    const meetingUrl = meetingId ? `${BASE_URL}/meetings.html?id=${meetingId}` : `${BASE_URL}/meetings.html`

    const payload = {
        embeds: [{
            title: `💬 [${meetingTitle}] 새 댓글`,
            url: meetingUrl,
            description: cleanContent.substring(0, 500),
            color: 0x388bfd,
            author: {
                name: comment.authorName || comment.authorEmail
            },
            timestamp: new Date().toISOString()
        }]
    }

    return await sendWebhook(webhookUrl, payload)
}

// 멘션 알림 전송
export async function sendMentionNotification(meetingTitle, comment, meetingId) {
    await ensureWebhookConfig()
    if (!isOptionEnabled('meeting', 'mention')) return false

    const webhookUrl = getWebhookUrl('meeting')
    if (!webhookUrl) return false

    const discordMentions = comment.mentions
        .filter(m => m.discordId)
        .map(m => `<@${m.discordId}>`)
        .join(' ')

    if (!discordMentions) return false

    // 댓글 내용에서 @이메일 제거
    const cleanContent = comment.content.replace(/@\S+@\S+\.\S+/g, '').trim()

    const meetingUrl = meetingId ? `${BASE_URL}/meetings.html?id=${meetingId}` : `${BASE_URL}/meetings.html`

    const payload = {
        content: discordMentions,
        embeds: [{
            title: `🔔 [${meetingTitle}] 멘션 알림`,
            url: meetingUrl,
            description: cleanContent.substring(0, 500),
            color: 0x5865F2,
            author: {
                name: comment.authorName || comment.authorEmail
            },
            timestamp: new Date().toISOString()
        }]
    }

    return await sendWebhook(webhookUrl, payload)
}

// 회의록 삭제 알림
export async function sendMeetingDeleteNotification(meeting, deletedBy) {
    await ensureWebhookConfig()
    if (!isOptionEnabled('meeting', 'delete')) return false

    const webhookUrl = getWebhookUrl('meeting')
    if (!webhookUrl) return false

    const payload = {
        embeds: [{
            title: '🗑️ 회의록 삭제',
            url: `${BASE_URL}/meetings.html`,
            description: meeting.title,
            color: 0xda3633,
            fields: [
                { name: '삭제자', value: deletedBy, inline: true }
            ],
            timestamp: new Date().toISOString()
        }]
    }

    return await sendWebhook(webhookUrl, payload)
}

// ============================================
// 캘린더 관련 알림
// ============================================

// 새 공유 일정 생성 알림
export async function sendNewEventNotification(event) {
    await ensureWebhookConfig()
    if (!isOptionEnabled('calendar', 'newEvent')) return false

    const webhookUrl = getWebhookUrl('calendar')
    if (!webhookUrl) return false

    const payload = {
        embeds: [{
            title: '📅 새 공유 일정',
            url: `${BASE_URL}/index.html`,
            description: event.title,
            color: 0x238636,
            fields: [
                { name: '날짜', value: event.date, inline: true },
                { name: '시간', value: event.time || '종일', inline: true },
                { name: '작성자', value: event.createdByName || event.createdByEmail, inline: true }
            ],
            timestamp: new Date().toISOString()
        }]
    }

    return await sendWebhook(webhookUrl, payload)
}

// 일정 수정 알림
export async function sendEventEditNotification(event, editedBy) {
    await ensureWebhookConfig()
    if (!isOptionEnabled('calendar', 'editEvent')) return false

    const webhookUrl = getWebhookUrl('calendar')
    if (!webhookUrl) return false

    const payload = {
        embeds: [{
            title: '✏️ 일정 수정',
            url: `${BASE_URL}/index.html`,
            description: event.title,
            color: 0xffa500,
            fields: [
                { name: '날짜', value: event.date, inline: true },
                { name: '수정자', value: editedBy, inline: true }
            ],
            timestamp: new Date().toISOString()
        }]
    }

    return await sendWebhook(webhookUrl, payload)
}

// 일정 삭제 알림
export async function sendEventDeleteNotification(event, deletedBy) {
    await ensureWebhookConfig()
    if (!isOptionEnabled('calendar', 'deleteEvent')) return false

    const webhookUrl = getWebhookUrl('calendar')
    if (!webhookUrl) return false

    const payload = {
        embeds: [{
            title: '🗑️ 일정 삭제',
            url: `${BASE_URL}/index.html`,
            description: event.title,
            color: 0xda3633,
            fields: [
                { name: '삭제자', value: deletedBy, inline: true }
            ],
            timestamp: new Date().toISOString()
        }]
    }

    return await sendWebhook(webhookUrl, payload)
}

// ============================================
// 프로젝트 관련 알림
// ============================================

// 새 프로젝트 생성 알림
export async function sendNewProjectNotification(project, projectId) {
    await ensureWebhookConfig()
    if (!isOptionEnabled('project', 'newProject')) return false

    const webhookUrl = getWebhookUrl('project')
    if (!webhookUrl) return false

    const projectUrl = projectId ? `${BASE_URL}/projects.html?id=${projectId}` : `${BASE_URL}/projects.html`

    const payload = {
        embeds: [{
            title: '🚀 새 프로젝트 생성',
            url: projectUrl,
            description: project.title,
            color: 0x238636,
            fields: [
                { name: '기간', value: `${project.startDate} ~ ${project.endDate}`, inline: true },
                { name: '생성자', value: project.createdByEmail, inline: true }
            ],
            timestamp: new Date().toISOString()
        }]
    }

    return await sendWebhook(webhookUrl, payload)
}

// 마일스톤 완료 알림
export async function sendMilestoneCompleteNotification(project, milestone) {
    await ensureWebhookConfig()
    if (!isOptionEnabled('project', 'milestone')) return false

    const webhookUrl = getWebhookUrl('project')
    if (!webhookUrl) return false

    const projectUrl = project.id ? `${BASE_URL}/projects.html?id=${project.id}` : `${BASE_URL}/projects.html`

    const payload = {
        embeds: [{
            title: '🎯 마일스톤 완료',
            url: projectUrl,
            description: milestone.title,
            color: 0x00D166,
            fields: [
                { name: '프로젝트', value: project.title, inline: true }
            ],
            timestamp: new Date().toISOString()
        }]
    }

    return await sendWebhook(webhookUrl, payload)
}

// 태스크 할당 알림
export async function sendTaskAssignNotification(project, task, assignee) {
    await ensureWebhookConfig()
    if (!isOptionEnabled('project', 'taskAssign')) return false

    const webhookUrl = getWebhookUrl('project')
    if (!webhookUrl) return false

    // Discord ID가 있으면 멘션
    const discordId = getDiscordIdByEmail(assignee.email)
    const mention = discordId ? `<@${discordId}>` : ''

    const projectUrl = project.id ? `${BASE_URL}/projects.html?id=${project.id}` : `${BASE_URL}/projects.html`

    const payload = {
        content: mention || undefined,
        embeds: [{
            title: '📋 태스크 할당',
            url: projectUrl,
            description: task.title,
            color: 0x388bfd,
            fields: [
                { name: '프로젝트', value: project.title, inline: true },
                { name: '담당자', value: assignee.name || assignee.email, inline: true },
                { name: '기한', value: task.endDate || '미정', inline: true }
            ],
            timestamp: new Date().toISOString()
        }]
    }

    return await sendWebhook(webhookUrl, payload)
}

// 태스크 완료 알림
export async function sendTaskCompleteNotification(project, task, completedBy) {
    await ensureWebhookConfig()
    if (!isOptionEnabled('project', 'taskComplete')) return false

    const webhookUrl = getWebhookUrl('project')
    if (!webhookUrl) return false

    const projectUrl = project.id ? `${BASE_URL}/projects.html?id=${project.id}` : `${BASE_URL}/projects.html`

    const payload = {
        embeds: [{
            title: '✅ 태스크 완료',
            url: projectUrl,
            description: task.title,
            color: 0x00D166,
            fields: [
                { name: '프로젝트', value: project.title, inline: true },
                { name: '완료자', value: completedBy, inline: true }
            ],
            timestamp: new Date().toISOString()
        }]
    }

    return await sendWebhook(webhookUrl, payload)
}

// ============================================
// 유틸리티 함수
// ============================================

// 웹훅 설정이 로드되었는지 확인하고, 안 되어있으면 로드
async function ensureWebhookConfig() {
    if (!webhookConfig.meeting.url && !webhookConfig.calendar.url && !webhookConfig.project.url) {
        await getWebhookConfig()
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

    return await sendWebhook(webhookUrl, payload)
}

// 공통 웹훅 전송 함수
async function sendWebhook(webhookUrl, payload) {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        return response.ok
    } catch (error) {
        console.error('Discord 웹훅 전송 실패:', error)
        return false
    }
}

// 이메일로 Discord ID 조회 (멘션 파싱용)
export function resolveDiscordId(email) {
    return getDiscordIdByEmail(email)
}
