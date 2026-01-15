// 관리자 이메일 목록
export const adminEmails = [
    '990914s@gmail.com'
]

export function isAdmin(email) {
    if (!email) return false
    return adminEmails.includes(email.toLowerCase())
}
