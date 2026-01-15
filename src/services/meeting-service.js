import { db } from '../lib/firebase.js'
import { ref, push, set, update, remove, onValue } from 'firebase/database'
import { updateSyncStatus } from '../utils/helpers.js'

let meetings = []
let meetingsCallback = null

export function getMeetings() {
    return meetings
}

export function getMeetingById(id) {
    return meetings.find(m => m.id === id)
}

export function setMeetingsCallback(callback) {
    meetingsCallback = callback
}

export function setupMeetingsListener() {
    const meetingsRef = ref(db, 'meetings')

    onValue(meetingsRef, (snapshot) => {
        meetings = []
        const data = snapshot.val()

        if (data) {
            Object.keys(data).forEach(key => {
                meetings.push({ id: key, ...data[key] })
            })
            meetings.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        }

        updateSyncStatus('connected')

        if (meetingsCallback) {
            meetingsCallback(meetings)
        }
    }, (error) => {
        console.error('Realtime Database 에러:', error)
        updateSyncStatus('offline')
        alert('데이터베이스 연결에 실패했습니다. 보안 규칙을 확인해주세요.')
    })
}

export async function createMeeting(title, content, category) {
    updateSyncStatus('syncing')

    try {
        const meetingsRef = ref(db, 'meetings')
        const newMeetingRef = push(meetingsRef)

        await set(newMeetingRef, {
            title: title,
            content: content,
            category: category === '미분류' ? '' : category,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })

        return newMeetingRef.key
    } catch (error) {
        console.error('회의록 생성 실패:', error)
        updateSyncStatus('offline')
        throw error
    }
}

export async function updateMeetingContent(id, content) {
    updateSyncStatus('syncing')

    try {
        const meetingRef = ref(db, 'meetings/' + id)
        await update(meetingRef, {
            content: content,
            updatedAt: new Date().toISOString()
        })
    } catch (error) {
        console.error('저장 실패:', error)
        updateSyncStatus('offline')
        throw error
    }
}

export async function updateMeetingCategory(id, category) {
    updateSyncStatus('syncing')

    try {
        const meetingRef = ref(db, 'meetings/' + id)
        await update(meetingRef, {
            category: category === '미분류' ? '' : category,
            updatedAt: new Date().toISOString()
        })
    } catch (error) {
        console.error('카테고리 변경 실패:', error)
        updateSyncStatus('offline')
        throw error
    }
}

export async function deleteMeeting(id) {
    updateSyncStatus('syncing')

    try {
        const meetingRef = ref(db, 'meetings/' + id)
        await remove(meetingRef)
    } catch (error) {
        console.error('삭제 실패:', error)
        updateSyncStatus('offline')
        throw error
    }
}
