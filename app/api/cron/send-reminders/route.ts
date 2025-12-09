import { NextResponse } from 'next/server'
import { sendUpcomingAppointmentReminders } from '@/app/appointments/actions'

function isAuthorized(request: Request) {
    const secret = process.env.CRON_SECRET
    const header = request.headers.get('authorization') || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    return Boolean(secret && token && token === secret)
}

async function handle(request: Request) {
    if (!isAuthorized(request)) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const result = await sendUpcomingAppointmentReminders(24, 1)
    const status = result && 'error' in result ? 500 : 200
    return NextResponse.json(result, { status })
}

export async function POST(request: Request) {
    return handle(request)
}

export async function GET(request: Request) {
    return handle(request)
}
