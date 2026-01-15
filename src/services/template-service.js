import { db } from '../lib/firebase.js'
import { ref, set, push, remove, onValue, off } from 'firebase/database'

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
    isDefault: true
}

let templates = [defaultTemplate]
let currentTemplateId = 'default'
let templatesRef = null
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
    // 로컬에서 현재 선택된 템플릿 ID 로드
    currentTemplateId = localStorage.getItem('currentTemplateId') || 'default'
}

export function setupTemplatesListener() {
    templatesRef = ref(db, 'templates')

    onValue(templatesRef, (snapshot) => {
        const data = snapshot.val()

        // 기본 템플릿은 항상 포함
        templates = [defaultTemplate]

        if (data) {
            const firebaseTemplates = Object.entries(data).map(([id, template]) => ({
                id,
                ...template
            }))
            templates = [defaultTemplate, ...firebaseTemplates]
        }

        // 현재 선택된 템플릿이 삭제되었으면 기본으로
        if (!templates.find(t => t.id === currentTemplateId)) {
            currentTemplateId = 'default'
            localStorage.setItem('currentTemplateId', currentTemplateId)
        }

        if (templateCallback) {
            templateCallback(templates)
        }
    })
}

export function removeTemplatesListener() {
    if (templatesRef) {
        off(templatesRef)
        templatesRef = null
    }
}

export function getCurrentTemplate() {
    return templates.find(t => t.id === currentTemplateId) || templates[0] || defaultTemplate
}

export function getTemplateById(id) {
    return templates.find(t => t.id === id)
}

export async function createTemplate(name, content) {
    const templatesRef = ref(db, 'templates')
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

    const templateRef = ref(db, `templates/${id}`)
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

    const templateRef = ref(db, `templates/${id}`)
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
