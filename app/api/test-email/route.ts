import { sendEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const to = searchParams.get('to') || process.env.SMTP_FROM

    if (!to) {
        return NextResponse.json({ error: 'No recipient specified and SMTP_FROM is missing' }, { status: 400 })
    }

    try {
        await sendEmail({
            to,
            subject: 'SMTP Legacy Test',
            text: 'This is a test email.',
        })
        return NextResponse.json({ success: true, message: `Email sent to ${to}` })
    } catch (error) {
        console.error('SMTP Test Error:', error)
        return NextResponse.json({ error: 'Failed to send email', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }
}
