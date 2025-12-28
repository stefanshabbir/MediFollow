import nodemailer from 'nodemailer'

const requiredEnv = ['SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'] as const
type RequiredEnv = typeof requiredEnv[number]

function assertEnv() {
    const missing = requiredEnv.filter((key) => !process.env[key])
    if (missing.length) {
        throw new Error(`Missing SMTP env vars: ${missing.join(', ')}`)
    }
}

let transporterPromise: ReturnType<typeof nodemailer.createTransport> | null = null

function getTransport() {
    if (!transporterPromise) {
        assertEnv()
        const host = process.env.SMTP_HOST || 'smtp.gmail.com'
        const port = Number(process.env.SMTP_PORT || 465)
        transporterPromise = nodemailer.createTransport({
            service: 'gmail',
            host,
            port,
            secure: port === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        })
    }
    return transporterPromise
}

export type SendEmailParams = {
    to: string | string[]
    subject: string
    text: string
    html?: string
}

export async function sendEmail(params: SendEmailParams) {
    const transport = getTransport()
    return transport.sendMail({
        from: process.env.SMTP_FROM,
        ...params,
    })
}
