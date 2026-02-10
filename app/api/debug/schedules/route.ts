
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    const { data: schedules, error } = await supabase
        .from('doctor_schedules')
        .select('*')

    const { data: profiles } = await supabase.from('profiles').select('id, full_name, role').eq('role', 'doctor')

    const testDate = new Date('2023-10-27') // Friday
    const today = new Date()

    return NextResponse.json({
        env: {
            testDate: testDate.toString(),
            testDateDay: testDate.getDay(), // Should be 5 for Friday
            today: today.toString(),
            todayDay: today.getDay(),
            timezoneOffset: today.getTimezoneOffset()
        },
        doctorCount: profiles?.length,
        schedulesCount: schedules?.length,
        schedules: schedules,
        doctors: profiles,
        error: error?.message
    })
}
