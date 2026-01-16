import { db } from '../lib/firebase.js'
import { ref, push, set, remove, update, onValue, off, get } from 'firebase/database'
import { getCurrentUser } from './auth-service.js'
import { sendNewProjectNotification, sendTaskAssignNotification, sendTaskCompleteNotification } from './discord-webhook-service.js'

let projectsRef = null
let projects = []
let projectCallback = null
let currentProjectId = null

// 마일스톤 & 태스크
let milestonesRef = null
let tasksRef = null
let milestones = []
let tasks = []
let milestoneCallback = null
let taskCallback = null

export function setProjectCallback(callback) {
    projectCallback = callback
}

export function setMilestoneCallback(callback) {
    milestoneCallback = callback
}

export function setTaskCallback(callback) {
    taskCallback = callback
}

// 프로젝트 리스너
export function setupProjectsListener() {
    const user = getCurrentUser()
    if (!user) return

    projectsRef = ref(db, 'projects')
    onValue(projectsRef, (snapshot) => {
        const data = snapshot.val()
        projects = []

        if (data) {
            // 내가 멤버인 프로젝트만 필터링
            projects = Object.entries(data)
                .map(([id, project]) => ({ id, ...project }))
                .filter(project => {
                    // 생성자이거나 멤버에 포함된 경우
                    if (project.createdBy === user.uid) return true
                    if (project.members) {
                        return project.members.some(m => m.uid === user.uid || m.email === user.email)
                    }
                    return false
                })
        }

        if (projectCallback) {
            projectCallback(projects)
        }
    })
}

export function removeProjectsListener() {
    if (projectsRef) {
        off(projectsRef)
        projectsRef = null
    }
    projects = []
}

// 프로젝트 상세 리스너 (마일스톤 + 태스크)
export function setupProjectDetailListener(projectId) {
    currentProjectId = projectId

    // 마일스톤 리스너
    milestonesRef = ref(db, `milestones/${projectId}`)
    onValue(milestonesRef, (snapshot) => {
        const data = snapshot.val()
        milestones = []

        if (data) {
            milestones = Object.entries(data)
                .map(([id, milestone]) => ({ id, ...milestone }))
                .sort((a, b) => (a.order || 0) - (b.order || 0))
        }

        if (milestoneCallback) {
            milestoneCallback(milestones)
        }
    })

    // 태스크 리스너
    tasksRef = ref(db, `tasks/${projectId}`)
    onValue(tasksRef, (snapshot) => {
        const data = snapshot.val()
        tasks = []

        if (data) {
            tasks = Object.entries(data)
                .map(([id, task]) => ({ id, ...task }))
                .sort((a, b) => a.startDate?.localeCompare(b.startDate) || 0)
        }

        if (taskCallback) {
            taskCallback(tasks)
        }
    })
}

export function removeProjectDetailListener() {
    if (milestonesRef) {
        off(milestonesRef)
        milestonesRef = null
    }
    if (tasksRef) {
        off(tasksRef)
        tasksRef = null
    }
    milestones = []
    tasks = []
    currentProjectId = null
}

// 프로젝트 CRUD
export async function createProject(projectData) {
    const user = getCurrentUser()
    if (!user) return null

    const projectsRef = ref(db, 'projects')
    const newProjectRef = push(projectsRef)

    const project = {
        title: projectData.title,
        description: projectData.description || '',
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        status: 'active',
        members: [{
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email,
            role: 'owner'
        }],
        createdBy: user.uid,
        createdByEmail: user.email,
        createdAt: Date.now()
    }

    await set(newProjectRef, project)

    // Discord 웹훅 알림 전송
    sendNewProjectNotification(project)

    return newProjectRef.key
}

export async function updateProject(projectId, projectData) {
    const projectRef = ref(db, `projects/${projectId}`)
    await update(projectRef, {
        ...projectData,
        updatedAt: Date.now()
    })
    return true
}

export async function deleteProject(projectId) {
    // 프로젝트 삭제
    await remove(ref(db, `projects/${projectId}`))
    // 관련 마일스톤 삭제
    await remove(ref(db, `milestones/${projectId}`))
    // 관련 태스크 삭제
    await remove(ref(db, `tasks/${projectId}`))
    return true
}

export function getProjects() {
    return projects
}

export function getProjectById(projectId) {
    return projects.find(p => p.id === projectId)
}

// 마일스톤 CRUD
export async function createMilestone(projectId, milestoneData) {
    const milestonesRef = ref(db, `milestones/${projectId}`)
    const newMilestoneRef = push(milestonesRef)

    const milestone = {
        title: milestoneData.title,
        startDate: milestoneData.startDate,
        endDate: milestoneData.endDate,
        color: milestoneData.color || '#238636',
        order: milestones.length,
        createdAt: Date.now()
    }

    await set(newMilestoneRef, milestone)
    return newMilestoneRef.key
}

export async function updateMilestone(projectId, milestoneId, milestoneData) {
    const milestoneRef = ref(db, `milestones/${projectId}/${milestoneId}`)
    await update(milestoneRef, {
        ...milestoneData,
        updatedAt: Date.now()
    })
    return true
}

export async function deleteMilestone(projectId, milestoneId) {
    await remove(ref(db, `milestones/${projectId}/${milestoneId}`))
    // 관련 태스크도 삭제하거나 마일스톤 연결 해제
    const tasksToUpdate = tasks.filter(t => t.milestoneId === milestoneId)
    for (const task of tasksToUpdate) {
        await update(ref(db, `tasks/${projectId}/${task.id}`), { milestoneId: null })
    }
    return true
}

export function getMilestones() {
    return milestones
}

export function getMilestoneById(milestoneId) {
    return milestones.find(m => m.id === milestoneId)
}

// 태스크 CRUD
export async function createTask(projectId, taskData) {
    const user = getCurrentUser()
    if (!user) return null

    const tasksRef = ref(db, `tasks/${projectId}`)
    const newTaskRef = push(tasksRef)

    const task = {
        title: taskData.title,
        milestoneId: taskData.milestoneId || null,
        assignee: taskData.assignee || null,
        startDate: taskData.startDate,
        endDate: taskData.endDate,
        status: 'pending',
        priority: taskData.priority || 'medium',
        createdBy: user.uid,
        createdAt: Date.now()
    }

    await set(newTaskRef, task)

    // 담당자가 있으면 Discord 알림 전송
    if (task.assignee) {
        const project = getProjectById(projectId)
        if (project) {
            sendTaskAssignNotification(project, task, task.assignee)
        }
    }

    return newTaskRef.key
}

export async function updateTask(projectId, taskId, taskData) {
    const user = getCurrentUser()
    const oldTask = getTaskById(taskId)
    const project = getProjectById(projectId)

    const taskRef = ref(db, `tasks/${projectId}/${taskId}`)
    await update(taskRef, {
        ...taskData,
        updatedAt: Date.now()
    })

    // 태스크가 완료되면 Discord 알림 전송
    if (project && taskData.status === 'completed' && oldTask?.status !== 'completed') {
        sendTaskCompleteNotification(project, { ...oldTask, ...taskData }, user?.displayName || user?.email || '알 수 없음')
    }

    // 새로운 담당자가 할당되면 Discord 알림 전송
    if (project && taskData.assignee && (!oldTask?.assignee || oldTask.assignee.email !== taskData.assignee.email)) {
        sendTaskAssignNotification(project, { ...oldTask, ...taskData }, taskData.assignee)
    }

    return true
}

export async function deleteTask(projectId, taskId) {
    await remove(ref(db, `tasks/${projectId}/${taskId}`))
    return true
}

export function getTasks() {
    return tasks
}

export function getTaskById(taskId) {
    return tasks.find(t => t.id === taskId)
}

export function getTasksByMilestone(milestoneId) {
    return tasks.filter(t => t.milestoneId === milestoneId)
}

// 프로젝트 멤버 관리
export async function addProjectMember(projectId, memberData) {
    const project = getProjectById(projectId)
    if (!project) return false

    const members = project.members || []

    // 이미 멤버인지 확인
    if (members.some(m => m.email === memberData.email)) {
        return false
    }

    members.push({
        uid: memberData.uid || null,
        email: memberData.email,
        name: memberData.name || memberData.email,
        role: memberData.role || 'member'
    })

    await update(ref(db, `projects/${projectId}`), { members })
    return true
}

export async function removeProjectMember(projectId, email) {
    const project = getProjectById(projectId)
    if (!project) return false

    const members = (project.members || []).filter(m => m.email !== email)
    await update(ref(db, `projects/${projectId}`), { members })
    return true
}

export async function updateMemberRole(projectId, email, role) {
    const project = getProjectById(projectId)
    if (!project) return false

    const members = project.members || []
    const memberIndex = members.findIndex(m => m.email === email)

    if (memberIndex === -1) return false

    members[memberIndex].role = role
    await update(ref(db, `projects/${projectId}`), { members })
    return true
}

// 프로젝트 진행률 계산
export function calculateProjectProgress(projectId) {
    const projectTasks = tasks.filter(t => currentProjectId === projectId || true)
    if (projectTasks.length === 0) return 0

    const completedTasks = projectTasks.filter(t => t.status === 'completed')
    return Math.round((completedTasks.length / projectTasks.length) * 100)
}

// 나에게 할당된 태스크 가져오기 (모든 프로젝트에서)
export async function getMyAssignedTasks() {
    const user = getCurrentUser()
    if (!user) return []

    const myTasks = []

    for (const project of projects) {
        const tasksSnapshot = await get(ref(db, `tasks/${project.id}`))
        const tasksData = tasksSnapshot.val()

        if (tasksData) {
            Object.entries(tasksData).forEach(([id, task]) => {
                if (task.assignee?.email === user.email || task.assignee?.uid === user.uid) {
                    myTasks.push({
                        id,
                        ...task,
                        projectId: project.id,
                        projectTitle: project.title
                    })
                }
            })
        }
    }

    return myTasks.sort((a, b) => a.endDate?.localeCompare(b.endDate) || 0)
}
