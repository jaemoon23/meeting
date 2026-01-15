import { escapeHtml } from '../utils/helpers.js'
import { getCategories, addCategory, deleteCategory } from '../services/category-service.js'
import { createMeeting, updateMeetingCategory } from '../services/meeting-service.js'
import {
    getTemplates,
    getCurrentTemplateId,
    setCurrentTemplateId,
    getCurrentTemplate,
    getDefaultTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate
} from '../services/template-service.js'
import { getCurrentMeetingId, setCurrentMeetingId } from './meeting-list.js'
import { showContentView } from './editor.js'
import { getMeetingById } from '../services/meeting-service.js'

let selectedNewCategory = '미분류'
let selectedChangeCategory = ''
let editingTemplateId = null
let isNewTemplateShared = true
let onMeetingCreatedCallback = null

export function setOnMeetingCreatedCallback(callback) {
    onMeetingCreatedCallback = callback
}

// Upload Modal
export function showUploadModal() {
    document.getElementById('uploadModal').classList.add('show')
}

export function hideUploadModal() {
    document.getElementById('uploadModal').classList.remove('show')
}

// New Meeting Modal
export function showNewMeetingModal() {
    renderNewMeetingCategorySelect()
    document.getElementById('newMeetingModal').classList.add('show')
    document.getElementById('newMeetingTitle').value = ''
    document.getElementById('newMeetingTitle').focus()
    selectedNewCategory = '미분류'
}

export function hideNewMeetingModal() {
    document.getElementById('newMeetingModal').classList.remove('show')
}

function renderNewMeetingCategorySelect() {
    const container = document.getElementById('newMeetingCategorySelect')
    const categories = getCategories()
    const availableCategories = ['미분류', ...categories.filter(c => c !== '전체')]

    container.innerHTML = availableCategories.map(cat => `
        <button type="button" class="category-option ${cat === selectedNewCategory ? 'selected' : ''}"
                data-category="${cat}">
            ${cat}
        </button>
    `).join('')

    container.querySelectorAll('.category-option').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedNewCategory = btn.dataset.category
            renderNewMeetingCategorySelect()
        })
    })
}

async function confirmNewMeeting() {
    const title = document.getElementById('newMeetingTitle').value.trim()
    if (!title) {
        alert('제목을 입력해주세요.')
        return
    }

    const template = getCurrentTemplate()
    const content = template.content.replace(/\{\{제목\}\}/g, title)

    try {
        const newId = await createMeeting(title, content, selectedNewCategory)
        hideNewMeetingModal()
        setCurrentMeetingId(newId)

        if (onMeetingCreatedCallback) {
            onMeetingCreatedCallback(newId)
        }
    } catch (error) {
        alert('회의록 생성에 실패했습니다.')
    }
}

// Category Modal
export function showCategoryModal() {
    renderCategoryList()
    document.getElementById('categoryModal').classList.add('show')
    document.getElementById('newCategoryInput').value = ''
}

export function hideCategoryModal() {
    document.getElementById('categoryModal').classList.remove('show')
}

function renderCategoryList() {
    const container = document.getElementById('categoryList')
    const categories = getCategories()
    const editableCategories = categories.filter(c => c !== '전체')

    if (editableCategories.length === 0) {
        container.innerHTML = '<div style="color: #8b949e; text-align: center; padding: 16px;">등록된 카테고리가 없습니다</div>'
        return
    }

    container.innerHTML = editableCategories.map(cat => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #21262d; border-radius: 6px; margin-bottom: 8px;">
            <span>${escapeHtml(cat)}</span>
            <button class="btn btn-small category-delete-btn" data-category="${cat}" style="color: #f85149;">삭제</button>
        </div>
    `).join('')

    container.querySelectorAll('.category-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.dataset.category
            if (confirm(`"${cat}" 카테고리를 삭제하시겠습니까?`)) {
                deleteCategory(cat)
                renderCategoryList()
            }
        })
    })
}

function handleAddCategory() {
    const input = document.getElementById('newCategoryInput')
    const name = input.value.trim()

    if (!name) {
        alert('카테고리 이름을 입력해주세요.')
        return
    }

    if (!addCategory(name)) {
        alert('이미 존재하는 카테고리입니다.')
        return
    }

    renderCategoryList()
    input.value = ''
}

// Change Category Modal
export function showChangeCategoryModal() {
    const currentMeetingId = getCurrentMeetingId()
    if (!currentMeetingId) return

    const meeting = getMeetingById(currentMeetingId)
    selectedChangeCategory = meeting?.category || '미분류'
    renderChangeCategorySelect()
    document.getElementById('changeCategoryModal').classList.add('show')
}

export function hideChangeCategoryModal() {
    document.getElementById('changeCategoryModal').classList.remove('show')
}

function renderChangeCategorySelect() {
    const container = document.getElementById('changeCategorySelect')
    const categories = getCategories()
    const availableCategories = ['미분류', ...categories.filter(c => c !== '전체')]

    container.innerHTML = availableCategories.map(cat => `
        <button type="button" class="category-option ${cat === selectedChangeCategory ? 'selected' : ''}"
                data-category="${cat}">
            ${cat}
        </button>
    `).join('')

    container.querySelectorAll('.category-option').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedChangeCategory = btn.dataset.category
            renderChangeCategorySelect()
        })
    })
}

async function confirmChangeCategory() {
    const currentMeetingId = getCurrentMeetingId()
    if (!currentMeetingId) return

    try {
        await updateMeetingCategory(currentMeetingId, selectedChangeCategory)
        hideChangeCategoryModal()
    } catch (error) {
        alert('카테고리 변경에 실패했습니다.')
    }
}

// Template Modal
export function showTemplateModal() {
    document.getElementById('templateModal').classList.add('show')
    switchTemplateTab('list')
    renderTemplateList()
}

export function hideTemplateModal() {
    document.getElementById('templateModal').classList.remove('show')
}

function switchTemplateTab(tab) {
    document.querySelectorAll('.template-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.templateTab === tab)
    })

    document.getElementById('templateListPane').style.display = tab === 'list' ? 'block' : 'none'
    document.getElementById('templateEditPane').style.display = tab === 'edit' ? 'block' : 'none'
    document.getElementById('templateUploadPane').style.display = tab === 'upload' ? 'block' : 'none'
}

function renderTemplateList() {
    const list = document.getElementById('templateList')
    const templates = getTemplates()
    const currentTemplateId = getCurrentTemplateId()

    if (templates.length === 0) {
        list.innerHTML = '<div class="empty-template-list">등록된 템플릿이 없습니다</div>'
        return
    }

    // 공유 템플릿과 개인 템플릿 분리
    const sharedTemplates = templates.filter(t => t.isShared)
    const personalTemplates = templates.filter(t => !t.isShared)

    let html = ''

    if (sharedTemplates.length > 0) {
        html += '<div class="template-section-header">🌐 공유 템플릿</div>'
        html += sharedTemplates.map(template => renderTemplateItem(template, currentTemplateId)).join('')
    }

    if (personalTemplates.length > 0) {
        html += '<div class="template-section-header" style="margin-top: 16px;">👤 내 템플릿</div>'
        html += personalTemplates.map(template => renderTemplateItem(template, currentTemplateId)).join('')
    }

    list.innerHTML = html

    list.querySelectorAll('.template-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('set-default-btn')) {
                editTemplate(item.dataset.id)
            }
        })
    })

    list.querySelectorAll('.set-default-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation()
            setCurrentTemplateId(btn.dataset.id)
            renderTemplateList()
        })
    })
}

function renderTemplateItem(template, currentTemplateId) {
    return `
        <div class="template-item ${template.id === currentTemplateId ? 'default' : ''}" data-id="${template.id}">
            <div class="template-item-info">
                <div class="template-item-name">${escapeHtml(template.name)}</div>
                <div class="template-item-preview">${escapeHtml(template.content.substring(0, 80))}...</div>
            </div>
            <div class="template-item-actions">
                ${template.id === currentTemplateId ? '<span class="template-item-badge">사용 중</span>' : ''}
                <button class="template-item-btn set-default-btn" data-id="${template.id}">
                    ${template.id === currentTemplateId ? '✓' : '기본으로 설정'}
                </button>
            </div>
        </div>
    `
}

function createNewTemplate() {
    editingTemplateId = null
    isNewTemplateShared = true
    document.getElementById('templateName').value = ''
    document.getElementById('templateEditor').value = getDefaultTemplate().content
    document.getElementById('deleteTemplateBtn').style.display = 'none'
    updateShareToggle()
    document.getElementById('templateShareToggle').style.display = 'flex'
    switchTemplateTab('edit')
}

function updateShareToggle() {
    const toggle = document.getElementById('templateShareToggle')
    if (!toggle) return
    toggle.innerHTML = `
        <span style="font-size: 13px; color: #8b949e;">저장 위치:</span>
        <button type="button" class="share-toggle-btn ${isNewTemplateShared ? 'active' : ''}" data-shared="true">🌐 공유</button>
        <button type="button" class="share-toggle-btn ${!isNewTemplateShared ? 'active' : ''}" data-shared="false">👤 개인</button>
    `
    toggle.querySelectorAll('.share-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            isNewTemplateShared = btn.dataset.shared === 'true'
            updateShareToggle()
        })
    })
}

function editTemplate(id) {
    const templates = getTemplates()
    const template = templates.find(t => t.id === id)
    if (!template) return

    editingTemplateId = id
    document.getElementById('templateName').value = template.name
    document.getElementById('templateEditor').value = template.content
    document.getElementById('deleteTemplateBtn').style.display = template.isDefault ? 'none' : 'block'
    document.getElementById('templateShareToggle').style.display = 'none'
    switchTemplateTab('edit')
}

async function saveTemplateHandler() {
    const name = document.getElementById('templateName').value.trim()
    const content = document.getElementById('templateEditor').value

    if (!name) {
        alert('템플릿 이름을 입력해주세요.')
        return
    }

    if (!content) {
        alert('템플릿 내용을 입력해주세요.')
        return
    }

    try {
        if (editingTemplateId) {
            await updateTemplate(editingTemplateId, name, content)
        } else {
            await createTemplate(name, content, isNewTemplateShared)
        }

        switchTemplateTab('list')
        alert('템플릿이 저장되었습니다!')
    } catch (error) {
        alert('템플릿 저장에 실패했습니다.')
    }
}

async function deleteCurrentTemplate() {
    if (!editingTemplateId) return

    if (editingTemplateId === 'default') {
        alert('기본 템플릿은 삭제할 수 없습니다.')
        return
    }

    if (!confirm('정말 이 템플릿을 삭제하시겠습니까?')) return

    try {
        await deleteTemplate(editingTemplateId)
        switchTemplateTab('list')
    } catch (error) {
        alert('템플릿 삭제에 실패했습니다.')
    }
}

function handleTemplateFileSelect(file) {
    const reader = new FileReader()
    reader.onload = function (e) {
        const content = e.target.result
        const name = file.name.replace(/\.(md|markdown|txt)$/, '')

        editingTemplateId = null
        document.getElementById('templateName').value = name
        document.getElementById('templateEditor').value = content
        document.getElementById('deleteTemplateBtn').style.display = 'none'
        switchTemplateTab('edit')
    }
    reader.readAsText(file)
}

// File Upload Handler
export async function processFile(file) {
    const reader = new FileReader()
    reader.onload = async function (e) {
        const content = e.target.result
        const title = file.name.replace(/\.(md|markdown|txt)$/, '')

        try {
            const newId = await createMeeting(title, content, '')
            hideUploadModal()
            setCurrentMeetingId(newId)

            if (onMeetingCreatedCallback) {
                onMeetingCreatedCallback(newId)
            }
        } catch (error) {
            alert('업로드에 실패했습니다.')
        }
    }
    reader.readAsText(file)
}

// Setup all modals
export function setupModals() {
    // Upload Modal
    const uploadArea = document.getElementById('uploadArea')
    const fileInput = document.getElementById('fileInput')
    const uploadModalCloseBtn = document.getElementById('uploadModalCloseBtn')

    uploadArea.addEventListener('click', () => fileInput.click())
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0]
        if (file) processFile(file)
    })

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault()
        uploadArea.classList.add('dragover')
    })
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'))
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault()
        uploadArea.classList.remove('dragover')
        const file = e.dataTransfer.files[0]
        if (file && (file.name.endsWith('.md') || file.name.endsWith('.markdown') || file.name.endsWith('.txt'))) {
            processFile(file)
        } else {
            alert('.md, .markdown, .txt 파일만 업로드할 수 있습니다.')
        }
    })

    uploadModalCloseBtn.addEventListener('click', hideUploadModal)
    document.getElementById('uploadModal').addEventListener('click', (e) => {
        if (e.target.id === 'uploadModal') hideUploadModal()
    })

    // New Meeting Modal
    const newMeetingModalCloseBtn = document.getElementById('newMeetingModalCloseBtn')
    const newMeetingConfirmBtn = document.getElementById('newMeetingConfirmBtn')
    const newMeetingTitle = document.getElementById('newMeetingTitle')

    newMeetingModalCloseBtn.addEventListener('click', hideNewMeetingModal)
    newMeetingConfirmBtn.addEventListener('click', confirmNewMeeting)
    newMeetingTitle.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') confirmNewMeeting()
    })
    document.getElementById('newMeetingModal').addEventListener('click', (e) => {
        if (e.target.id === 'newMeetingModal') hideNewMeetingModal()
    })

    // Category Modal
    const categoryModalCloseBtn = document.getElementById('categoryModalCloseBtn')
    const addCategoryBtn = document.getElementById('addCategoryBtn')
    const newCategoryInput = document.getElementById('newCategoryInput')

    categoryModalCloseBtn.addEventListener('click', hideCategoryModal)
    addCategoryBtn.addEventListener('click', handleAddCategory)
    newCategoryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddCategory()
    })
    document.getElementById('categoryModal').addEventListener('click', (e) => {
        if (e.target.id === 'categoryModal') hideCategoryModal()
    })

    // Change Category Modal
    const changeCategoryModalCloseBtn = document.getElementById('changeCategoryModalCloseBtn')
    const changeCategoryConfirmBtn = document.getElementById('changeCategoryConfirmBtn')
    const contentCategory = document.getElementById('contentCategory')

    changeCategoryModalCloseBtn.addEventListener('click', hideChangeCategoryModal)
    changeCategoryConfirmBtn.addEventListener('click', confirmChangeCategory)
    contentCategory.addEventListener('click', showChangeCategoryModal)
    document.getElementById('changeCategoryModal').addEventListener('click', (e) => {
        if (e.target.id === 'changeCategoryModal') hideChangeCategoryModal()
    })

    // Template Modal
    const templateModalCloseBtn = document.getElementById('templateModalCloseBtn')
    const templateListTab = document.getElementById('templateListTab')
    const templateEditTab = document.getElementById('templateEditTab')
    const templateUploadTab = document.getElementById('templateUploadTab')
    const createNewTemplateBtn = document.getElementById('createNewTemplateBtn')
    const templateBackBtn = document.getElementById('templateBackBtn')
    const saveTemplateBtn = document.getElementById('saveTemplateBtn')
    const deleteTemplateBtn = document.getElementById('deleteTemplateBtn')
    const templateUploadArea = document.getElementById('templateUploadArea')
    const templateFileInput = document.getElementById('templateFileInput')

    templateModalCloseBtn.addEventListener('click', hideTemplateModal)
    templateListTab.addEventListener('click', () => switchTemplateTab('list'))
    templateEditTab.addEventListener('click', () => switchTemplateTab('edit'))
    templateUploadTab.addEventListener('click', () => switchTemplateTab('upload'))
    createNewTemplateBtn.addEventListener('click', createNewTemplate)
    templateBackBtn.addEventListener('click', () => switchTemplateTab('list'))
    saveTemplateBtn.addEventListener('click', saveTemplateHandler)
    deleteTemplateBtn.addEventListener('click', deleteCurrentTemplate)

    templateUploadArea.addEventListener('click', () => templateFileInput.click())
    templateFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0]
        if (file) handleTemplateFileSelect(file)
        e.target.value = ''
    })

    templateUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault()
        templateUploadArea.classList.add('dragover')
    })
    templateUploadArea.addEventListener('dragleave', () => templateUploadArea.classList.remove('dragover'))
    templateUploadArea.addEventListener('drop', (e) => {
        e.preventDefault()
        templateUploadArea.classList.remove('dragover')
        const file = e.dataTransfer.files[0]
        if (file && (file.name.endsWith('.md') || file.name.endsWith('.markdown') || file.name.endsWith('.txt'))) {
            handleTemplateFileSelect(file)
        } else {
            alert('.md, .markdown, .txt 파일만 업로드할 수 있습니다.')
        }
    })

    document.getElementById('templateModal').addEventListener('click', (e) => {
        if (e.target.id === 'templateModal') hideTemplateModal()
    })
}
