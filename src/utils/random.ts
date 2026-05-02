export function generateRandomNumber(length: number) {
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    let otp = ''
    for (let i = 0; i < length; i++) {
        otp += numbers[Math.floor(Math.random() * numbers.length)]
    }
    return otp
}
