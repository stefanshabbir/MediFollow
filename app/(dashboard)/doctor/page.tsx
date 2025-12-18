import { createClient } from '@/utils/supabase/server'
import { getAppointments, getAppointmentRequests } from '@/app/appointments/actions'
import { DoctorDashboardClient } from './dashboard-client'
import { redirect } from 'next/navigation'

export default async function DoctorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is a doctor
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'doctor') {
    redirect('/')
  }

  const { data: appointments } = await getAppointments('doctor')
  const { data: appointmentRequests } = await getAppointmentRequests('doctor')

  return (
    <DoctorDashboardClient
      initialAppointments={appointments || []}
      initialRequests={appointmentRequests || []}
    />
  )
}
