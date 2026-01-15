// 허용된 이메일 목록
// 여기에 있는 이메일만 로그인 가능
export const allowedEmails = [
    '990914s@gmail.com',
    'sgntm1029@gmail.com',
    'dlcoqls002@gmail.com',
]

export function isEmailAllowed(email) {
    return allowedEmails.includes(email.toLowerCase())
}
