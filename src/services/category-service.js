import { getMeetings } from './meeting-service.js'

let categories = ['전체']
let categoryChangeCallback = null

export function getCategories() {
    return categories
}

export function setCategoryChangeCallback(callback) {
    categoryChangeCallback = callback
}

export function loadCategories() {
    const savedCategories = localStorage.getItem('categories')
    if (savedCategories) {
        const saved = JSON.parse(savedCategories)
        saved.forEach(c => {
            if (!categories.includes(c)) {
                categories.push(c)
            }
        })
    }
}

export function saveCategories() {
    localStorage.setItem('categories', JSON.stringify(categories.filter(c => c !== '전체')))
}

export function updateCategoriesFromMeetings() {
    const meetings = getMeetings()
    const categorySet = new Set(['전체'])

    meetings.forEach(m => {
        if (m.category && m.category !== '미분류') {
            categorySet.add(m.category)
        }
    })

    const savedCategories = localStorage.getItem('categories')
    if (savedCategories) {
        JSON.parse(savedCategories).forEach(c => categorySet.add(c))
    }

    categories = Array.from(categorySet)

    if (categoryChangeCallback) {
        categoryChangeCallback(categories)
    }
}

export function addCategory(name) {
    if (!name || categories.includes(name)) {
        return false
    }
    categories.push(name)
    saveCategories()

    if (categoryChangeCallback) {
        categoryChangeCallback(categories)
    }
    return true
}

export function deleteCategory(name) {
    categories = categories.filter(c => c !== name)
    saveCategories()

    if (categoryChangeCallback) {
        categoryChangeCallback(categories)
    }
}

export function getFilteredMeetings(filter, searchQuery) {
    const meetings = getMeetings()

    return meetings.filter(meeting => {
        const matchesCategory = filter === '전체' ||
            (meeting.category || '미분류') === filter

        const matchesSearch = !searchQuery ||
            meeting.title.toLowerCase().includes(searchQuery) ||
            meeting.content.toLowerCase().includes(searchQuery)

        return matchesCategory && matchesSearch
    })
}
