export function renderOnlineUsers(users) {
    const container = document.getElementById('onlineUsersContainer')
    if (!container) return

    if (users.length === 0) {
        container.innerHTML = `
            <div class="online-users-empty">접속자 없음</div>
        `
        return
    }

    const usersHtml = users.map(user => `
        <div class="online-user" title="${user.email}">
            ${user.photoURL
                ? `<img class="online-user-avatar" src="${user.photoURL}" alt="${user.displayName}">`
                : `<div class="online-user-avatar online-user-avatar-placeholder">${user.displayName.charAt(0)}</div>`
            }
            <span class="online-user-name">${user.displayName}</span>
        </div>
    `).join('')

    container.innerHTML = `
        <div class="online-users-header">
            <span class="online-indicator"></span>
            <span>접속 중 (${users.length})</span>
        </div>
        <div class="online-users-list">
            ${usersHtml}
        </div>
    `
}
