import { db } from '../lib/firebase.js'
import { ref, push, set, remove, onValue, off, query, orderByChild } from 'firebase/database'
import { getCurrentUser } from './auth-service.js'
import { sendNewEventNotification, sendEventEditNotification, sendEventDeleteNotification } from './discord-webhook-service.js'

let sharedEventsRef = null
let personalEventsRef = null
let sharedEvents = []
let personalEvents = []
let eventCallback = null

export function setEventCallback(callback) {
    eventCallback = callback
}

function mergeAndNotify() {
    const allEvents = [...sharedEvents, ...personalEvents]
    if (eventCallback) {
        eventCallback(allEvents)
    }
}

// 일정 리스너 설정
export function setupCalendarListener() {
    const user = getCurrentUser()
    if (!user) return

    // 공유 일정 리스너
    sharedEventsRef = ref(db, 'events/shared')
    onValue(sharedEventsRef, (snapshot) => {
        const data = snapshot.val()
        sharedEvents = []

        if (data) {
            sharedEvents = Object.entries(data).map(([id, event]) => ({
                id,
                ...event,
                isShared: true
            }))
        }

        mergeAndNotify()
    })

    // 개인 일정 리스너
    personalEventsRef = ref(db, `events/personal/${user.uid}`)
    onValue(personalEventsRef, (snapshot) => {
        const data = snapshot.val()
        personalEvents = []

        if (data) {
            personalEvents = Object.entries(data).map(([id, event]) => ({
                id,
                ...event,
                isShared: false
            }))
        }

        mergeAndNotify()
    })
}

// 리스너 제거
export function removeCalendarListener() {
    if (sharedEventsRef) {
        off(sharedEventsRef)
        sharedEventsRef = null
    }
    if (personalEventsRef) {
        off(personalEventsRef)
        personalEventsRef = null
    }
    sharedEvents = []
    personalEvents = []
}

// 일정 생성
export async function createEvent(eventData) {
    const user = getCurrentUser()
    if (!user) return null

    const basePath = eventData.isShared ? 'events/shared' : `events/personal/${user.uid}`
    const eventsRef = ref(db, basePath)
    const newEventRef = push(eventsRef)

    const event = {
        title: eventData.title,
        date: eventData.date,
        time: eventData.time || null,
        description: eventData.description || '',
        createdBy: user.uid,
        createdByEmail: user.email,
        createdByName: user.displayName || user.email,
        createdAt: Date.now()
    }

    await set(newEventRef, event)

    // 공유 일정인 경우 Discord 웹훅 알림 전송
    if (eventData.isShared) {
        sendNewEventNotification(event)
    }

    return newEventRef.key
}

// 일정 수정
export async function updateEvent(eventId, eventData, isShared) {
    const user = getCurrentUser()
    if (!user) return false

    const basePath = isShared ? 'events/shared' : `events/personal/${user.uid}`
    const eventRef = ref(db, `${basePath}/${eventId}`)

    await set(eventRef, {
        ...eventData,
        updatedAt: Date.now()
    })

    // 공유 일정인 경우 Discord 웹훅 알림 전송
    if (isShared) {
        sendEventEditNotification(eventData, user.displayName || user.email)
    }

    return true
}

// 일정 삭제
export async function deleteEvent(eventId, isShared, eventData = null) {
    const user = getCurrentUser()
    if (!user) return false

    // 삭제 전에 일정 정보 저장 (알림용)
    const eventToDelete = eventData || getAllEvents().find(e => e.id === eventId)

    const basePath = isShared ? 'events/shared' : `events/personal/${user.uid}`
    const eventRef = ref(db, `${basePath}/${eventId}`)
    await remove(eventRef)

    // 공유 일정인 경우 Discord 웹훅 알림 전송
    if (isShared && eventToDelete) {
        sendEventDeleteNotification(eventToDelete, user.displayName || user.email)
    }

    return true
}

// 특정 날짜의 일정 가져오기
export function getEventsByDate(date) {
    const allEvents = [...sharedEvents, ...personalEvents]
    return allEvents.filter(event => event.date === date)
}

// 특정 월의 일정 가져오기
export function getEventsByMonth(year, month) {
    const allEvents = [...sharedEvents, ...personalEvents]
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
    return allEvents.filter(event => event.date.startsWith(monthStr))
}

// 모든 일정 가져오기
export function getAllEvents() {
    return [...sharedEvents, ...personalEvents]
}

// 내 일정만 가져오기 (할당된 태스크 포함)
export function getMyEvents() {
    const user = getCurrentUser()
    if (!user) return []

    // 공유 일정 + 개인 일정
    return [...sharedEvents, ...personalEvents]
}

// 다가오는 일정 가져오기
export function getUpcomingEvents(days = 7) {
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + days)

    const todayStr = today.toISOString().split('T')[0]
    const futureStr = futureDate.toISOString().split('T')[0]

    const allEvents = [...sharedEvents, ...personalEvents]
    return allEvents
        .filter(event => event.date >= todayStr && event.date <= futureStr)
        .sort((a, b) => a.date.localeCompare(b.date))
}
