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

let templates = []
let currentTemplateId = 'default'

export function getTemplates() {
    return templates
}

export function getCurrentTemplateId() {
    return currentTemplateId
}

export function setCurrentTemplateId(id) {
    currentTemplateId = id
    saveTemplates()
}

export function loadTemplates() {
    const savedTemplates = localStorage.getItem('templates')
    if (savedTemplates) {
        templates = JSON.parse(savedTemplates)
    }

    if (!templates.find(t => t.id === 'default')) {
        templates.unshift(defaultTemplate)
        saveTemplates()
    }

    currentTemplateId = localStorage.getItem('currentTemplateId') || 'default'
}

export function saveTemplates() {
    localStorage.setItem('templates', JSON.stringify(templates))
    localStorage.setItem('currentTemplateId', currentTemplateId)
}

export function getCurrentTemplate() {
    return templates.find(t => t.id === currentTemplateId) || templates[0] || defaultTemplate
}

export function getTemplateById(id) {
    return templates.find(t => t.id === id)
}

export function createTemplate(name, content) {
    const newTemplate = {
        id: Date.now().toString(),
        name: name,
        content: content
    }
    templates.push(newTemplate)
    saveTemplates()
    return newTemplate.id
}

export function updateTemplate(id, name, content) {
    const template = templates.find(t => t.id === id)
    if (template) {
        template.name = name
        template.content = content
        saveTemplates()
    }
}

export function deleteTemplate(id) {
    if (id === 'default') {
        return false
    }

    templates = templates.filter(t => t.id !== id)

    if (currentTemplateId === id) {
        currentTemplateId = 'default'
    }

    saveTemplates()
    return true
}

export function getDefaultTemplate() {
    return defaultTemplate
}
