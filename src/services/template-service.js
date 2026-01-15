import { db } from '../lib/firebase.js'
import { ref, set, push, remove, onValue, off } from 'firebase/database'
import { getCurrentUser } from './auth-service.js'

const defaultTemplate = {
    id: 'default',
    name: '기본 템플릿',
    content: `# {{제목}}

## 📅 일시
-

## 👥 참석자
-

## 📋 안건
1.

## 💬 논의 내용

## ✅ 결정 사항

## 📌 다음 단계
`,
    isDefault: true,
    isShared: true
}

let templates = [defaultTemplate]
let currentTemplateId = 'default'
let sharedTemplatesRef = null
let userTemplatesRef = null
let templateCallback = null

export function setTemplateCallback(callback) {
    templateCallback = callback
}

export function getTemplates() {
    return templates
}

export function getCurrentTemplateId() {
    return currentTemplateId
}

export function setCurrentTemplateId(id) {
    currentTemplateId = id
    localStorage.setItem('currentTemplateId', currentTemplateId)
}

export function loadTemplates() {
    currentTemplateId = localStorage.getItem('currentTemplateId') || 'default'
}

let sharedTemplates = []
let userTemplates = []

function mergeTemplates() {
    // 기본 템플릿 + 공유 템플릿 + 개인 템플릿
    templates = [defaultTemplate, ...sharedTemplates, ...userTemplates]

    // 현재 선택된 템플릿이 삭제되었으면 기본으로
    if (!templates.find(t => t.id === currentTemplateId)) {
        currentTemplateId = 'default'
        localStorage.setItem('currentTemplateId', currentTemplateId)
    }

    if (templateCallback) {
        templateCallback(templates)
    }
}

export function setupTemplatesListener() {
    const user = getCurrentUser()
    if (!user) return

    // 공유 템플릿 리스너
    sharedTemplatesRef = ref(db, 'templates')
    onValue(sharedTemplatesRef, (snapshot) => {
        const data = snapshot.val()
        sharedTemplates = []

        if (data) {
            sharedTemplates = Object.entries(data).map(([id, template]) => ({
                id,
                ...template,
                isShared: true
            }))
        }

        mergeTemplates()
    })

    // 개인 템플릿 리스너
    userTemplatesRef = ref(db, `userTemplates/${user.uid}`)
    onValue(userTemplatesRef, (snapshot) => {
        const data = snapshot.val()
        userTemplates = []

        if (data) {
            userTemplates = Object.entries(data).map(([id, template]) => ({
                id,
                ...template,
                isShared: false
            }))
        }

        mergeTemplates()
    })
}

export function removeTemplatesListener() {
    if (sharedTemplatesRef) {
        off(sharedTemplatesRef)
        sharedTemplatesRef = null
    }
    if (userTemplatesRef) {
        off(userTemplatesRef)
        userTemplatesRef = null
    }
    sharedTemplates = []
    userTemplates = []
}

export function getCurrentTemplate() {
    return templates.find(t => t.id === currentTemplateId) || templates[0] || defaultTemplate
}

export function getTemplateById(id) {
    return templates.find(t => t.id === id)
}

export async function createTemplate(name, content, isShared = false) {
    const user = getCurrentUser()
    if (!user) return null

    const basePath = isShared ? 'templates' : `userTemplates/${user.uid}`
    const templatesRef = ref(db, basePath)
    const newTemplateRef = push(templatesRef)

    await set(newTemplateRef, {
        name,
        content,
        createdAt: Date.now()
    })

    return newTemplateRef.key
}

export async function updateTemplate(id, name, content) {
    if (id === 'default') {
        return false
    }

    const template = templates.find(t => t.id === id)
    if (!template) return false

    const user = getCurrentUser()
    if (!user) return false

    const basePath = template.isShared ? 'templates' : `userTemplates/${user.uid}`
    const templateRef = ref(db, `${basePath}/${id}`)

    await set(templateRef, {
        name,
        content,
        updatedAt: Date.now()
    })

    return true
}

export async function deleteTemplate(id) {
    if (id === 'default') {
        return false
    }

    const template = templates.find(t => t.id === id)
    if (!template) return false

    const user = getCurrentUser()
    if (!user) return false

    const basePath = template.isShared ? 'templates' : `userTemplates/${user.uid}`
    const templateRef = ref(db, `${basePath}/${id}`)
    await remove(templateRef)

    if (currentTemplateId === id) {
        currentTemplateId = 'default'
        localStorage.setItem('currentTemplateId', currentTemplateId)
    }

    return true
}

export function getDefaultTemplate() {
    return defaultTemplate
}
