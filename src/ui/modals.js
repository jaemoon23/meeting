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
    deleteTemplate,
    setTemplateCallback
} from '../services/template-service.js'
import {
    getDiscordMappings,
    saveMyDiscordId,
    saveDiscordIdForUser,
    getAllUsersWithMapping
} from '../services/discord-mapping-service.js'
import { getCurrentMeetingId, setCurrentMeetingId } from './meeting-list.js'
import { showContentView } from './editor.js'
import { getMeetingById } from '../services/meeting-service.js'
import { getCurrentUser } from '../services/auth-service.js'
import { isAdmin } from '../config/admin.js'

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
        // 새 템플릿 생성 시 이름 중복 체크
        if (!editingTemplateId) {
            const templates = getTemplates()
            // 같은 저장 위치(공유/개인)에서 중복 체크
            const duplicateTemplate = templates.find(t =>
                t.name === name &&
                t.isShared === isNewTemplateShared &&
                t.id !== 'default'
            )

            if (duplicateTemplate) {
                const replace = confirm(`"${name}" 템플릿이 이미 존재합니다.\n기존 템플릿을 대체하시겠습니까?`)
                if (replace) {
                    // 기존 템플릿 대체
                    await updateTemplate(duplicateTemplate.id, name, content)
                    switchTemplateTab('list')
                    alert('템플릿이 대체되었습니다!')
                    return
                } else {
                    // 이름 다시 지정하도록 포커스
                    document.getElementById('templateName').focus()
                    document.getElementById('templateName').select()
                    return
                }
            }

            await createTemplate(name, content, isNewTemplateShared)
        } else {
            // 편집 중일 때도 다른 템플릿과 이름 중복 체크
            const templates = getTemplates()
            const editingTemplate = templates.find(t => t.id === editingTemplateId)
            const duplicateTemplate = templates.find(t =>
                t.name === name &&
                t.id !== editingTemplateId &&
                t.isShared === editingTemplate?.isShared &&
                t.id !== 'default'
            )

            if (duplicateTemplate) {
                alert(`"${name}" 이름의 템플릿이 이미 존재합니다. 다른 이름을 사용해주세요.`)
                document.getElementById('templateName').focus()
                document.getElementById('templateName').select()
                return
            }

            await updateTemplate(editingTemplateId, name, content)
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
        isNewTemplateShared = true
        document.getElementById('templateName').value = name
        document.getElementById('templateEditor').value = content
        document.getElementById('deleteTemplateBtn').style.display = 'none'
        updateShareToggle()
        document.getElementById('templateShareToggle').style.display = 'flex'
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

// Discord Settings Modal
export function showDiscordSettingsModal() {
    document.getElementById('discordSettingsModal').classList.add('show')
    renderDiscordSettings()
}

export function hideDiscordSettingsModal() {
    document.getElementById('discordSettingsModal').classList.remove('show')
}

function renderDiscordSettings() {
    const user = getCurrentUser()
    if (!user) return

    const userIsAdmin = isAdmin(user.email)
    const container = document.getElementById('discordSettingsContent')
    const mappings = getDiscordMappings()

    // 내 Discord ID 정보
    const myMapping = mappings[user.uid] || {}

    let html = `
        <div class="discord-section">
            <div class="discord-section-header">내 Discord 설정</div>
            <div class="discord-my-settings">
                <div class="discord-input-group">
                    <label>Discord ID</label>
                    <input type="text" class="modal-input" id="myDiscordId"
                           value="${escapeHtml(myMapping.discordId || '')}"
                           placeholder="123456789012345678">
                    <div class="discord-input-hint">Discord 설정 → 고급 → 개발자 모드 ON → 프로필 우클릭 → ID 복사</div>
                </div>
                <div class="discord-input-group">
                    <label>Discord 닉네임 (선택)</label>
                    <input type="text" class="modal-input" id="myDiscordName"
                           value="${escapeHtml(myMapping.discordName || '')}"
                           placeholder="홍길동#1234">
                </div>
                <button class="btn btn-primary" id="saveMyDiscordBtn">💾 저장</button>
            </div>
        </div>
    `

    // 관리자 전용: 전체 사용자 관리
    if (userIsAdmin) {
        const allUsers = getAllUsersWithMapping()
        const registeredUsers = allUsers.filter(u => u.discordId)
        const unregisteredUsers = allUsers.filter(u => !u.discordId)

        html += `
            <div class="discord-section" style="margin-top: 24px;">
                <div class="discord-section-header">👑 관리자: 전체 사용자 Discord ID 관리</div>
        `

        // 미등록 사용자
        if (unregisteredUsers.length > 0) {
            html += `
                <div class="discord-subsection">
                    <div class="discord-subsection-header" style="color: #f85149;">
                        ⚠️ 미등록 사용자 (${unregisteredUsers.length}명)
                    </div>
                    <div class="discord-user-list">
            `
            for (const u of unregisteredUsers) {
                html += renderAdminUserItem(u)
            }
            html += `
                    </div>
                </div>
            `
        }

        // 등록된 사용자
        if (registeredUsers.length > 0) {
            html += `
                <div class="discord-subsection">
                    <div class="discord-subsection-header" style="color: #238636;">
                        ✅ 등록 완료 (${registeredUsers.length}명)
                    </div>
                    <div class="discord-user-list">
            `
            for (const u of registeredUsers) {
                html += renderAdminUserItem(u)
            }
            html += `
                    </div>
                </div>
            `
        }

        html += `</div>`
    }

    container.innerHTML = html

    // 내 Discord ID 저장 버튼
    document.getElementById('saveMyDiscordBtn')?.addEventListener('click', async () => {
        const discordId = document.getElementById('myDiscordId').value.trim()
        const discordName = document.getElementById('myDiscordName').value.trim()

        if (!discordId) {
            alert('Discord ID를 입력해주세요.')
            return
        }

        if (!/^\d{17,19}$/.test(discordId)) {
            alert('Discord ID는 17-19자리 숫자입니다.')
            return
        }

        try {
            await saveMyDiscordId(discordId, discordName)
            alert('저장되었습니다!')
            renderDiscordSettings()
        } catch (error) {
            alert('저장에 실패했습니다.')
        }
    })

    // 관리자: 각 사용자 저장 버튼
    if (userIsAdmin) {
        document.querySelectorAll('.admin-save-discord-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const uid = btn.dataset.uid
                const email = btn.dataset.email
                const displayName = btn.dataset.displayname || ''
                const row = btn.closest('.discord-user-item')
                const discordId = row.querySelector('.admin-discord-id').value.trim()
                const discordName = row.querySelector('.admin-discord-name').value.trim()

                if (!discordId) {
                    alert('Discord ID를 입력해주세요.')
                    return
                }

                if (!/^\d{17,19}$/.test(discordId)) {
                    alert('Discord ID는 17-19자리 숫자입니다.')
                    return
                }

                // uid가 없는 경우 (아직 로그인 안 한 사용자) - email 기반으로 임시 uid 생성
                const finalUid = uid || `pending_${email.replace(/[^a-zA-Z0-9]/g, '_')}`

                try {
                    await saveDiscordIdForUser(finalUid, email, displayName, discordId, discordName)
                    alert('저장되었습니다!')
                    renderDiscordSettings()
                } catch (error) {
                    alert('저장에 실패했습니다.')
                }
            })
        })
    }
}

function renderAdminUserItem(user) {
    return `
        <div class="discord-user-item">
            <div class="discord-user-info">
                <span class="discord-user-email">${escapeHtml(user.email)}</span>
                ${user.displayName ? `<span class="discord-user-name">(${escapeHtml(user.displayName)})</span>` : ''}
            </div>
            <div class="discord-user-inputs">
                <input type="text" class="modal-input admin-discord-id"
                       value="${escapeHtml(user.discordId || '')}"
                       placeholder="Discord ID">
                <input type="text" class="modal-input admin-discord-name"
                       value="${escapeHtml(user.discordName || '')}"
                       placeholder="닉네임">
                <button class="btn btn-primary admin-save-discord-btn"
                        data-uid="${user.uid || ''}"
                        data-email="${escapeHtml(user.email)}"
                        data-displayname="${escapeHtml(user.displayName || '')}">
                    저장
                </button>
            </div>
        </div>
    `
}

// Setup all modals
export function setupModals() {
    // 템플릿 실시간 업데이트 콜백 등록
    setTemplateCallback(() => {
        // 템플릿 모달이 열려있고, 목록 탭이 활성화된 경우에만 갱신
        const templateModal = document.getElementById('templateModal')
        const listPane = document.getElementById('templateListPane')
        if (templateModal?.classList.contains('show') && listPane?.style.display !== 'none') {
            renderTemplateList()
        }
    })

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
    const importMeetingBtn = document.getElementById('importMeetingBtn')
    const importMeetingFileInput = document.getElementById('importMeetingFileInput')

    newMeetingModalCloseBtn.addEventListener('click', hideNewMeetingModal)
    newMeetingConfirmBtn.addEventListener('click', confirmNewMeeting)
    newMeetingTitle.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') confirmNewMeeting()
    })
    document.getElementById('newMeetingModal').addEventListener('click', (e) => {
        if (e.target.id === 'newMeetingModal') hideNewMeetingModal()
    })

    // 파일에서 가져오기
    importMeetingBtn?.addEventListener('click', () => importMeetingFileInput.click())
    importMeetingFileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0]
        if (file) {
            hideNewMeetingModal()
            processFile(file)
        }
        e.target.value = ''
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

    // Discord Settings Modal
    const discordSettingsModalCloseBtn = document.getElementById('discordSettingsModalCloseBtn')
    if (discordSettingsModalCloseBtn) {
        discordSettingsModalCloseBtn.addEventListener('click', hideDiscordSettingsModal)
    }
    const discordSettingsModal = document.getElementById('discordSettingsModal')
    if (discordSettingsModal) {
        discordSettingsModal.addEventListener('click', (e) => {
            if (e.target.id === 'discordSettingsModal') hideDiscordSettingsModal()
        })
    }
}
