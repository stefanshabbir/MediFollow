import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ActivityTimeline } from '@/components/timeline/activity-timeline'
import { getPatientTimeline, TimelineThread } from './actions'

interface TimelinePageProps {
    searchParams: Promise<{ patientId?: string }>
}

export default async function TimelinePage(props: TimelinePageProps) {
    const searchParams = await props.searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Determine Patient ID
    let patientId = searchParams.patientId

    if (!patientId) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

        if (profile?.role === 'patient') {
            patientId = user.id
        } else {
            patientId = user.id
        }
    }

    // Fetch Initial Data
    let threads: TimelineThread[] = []
    try {
        threads = await getPatientTimeline(patientId!)
    } catch (e) {
        console.error("Failed to load timeline", e)
    }

    return (
        <ActivityTimeline initialThreads={threads} patientId={patientId || ''} />
    )
}
