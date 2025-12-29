import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { initiateAppointmentCheckout } from '@/app/appointments/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

function formatLkr(cents: number) {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR'
  }).format(cents / 100)
}

export default async function PatientCheckoutPage({ searchParams }: { searchParams: Promise<{ appointmentId?: string }> }) {
  const { appointmentId } = await searchParams
  if (!appointmentId) {
    redirect('/patient')
  }
  const safeAppointmentId = appointmentId as string

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: appointment } = await supabase
    .from('appointments')
    .select('*, doctor:doctor_id(full_name)')
    .eq('id', safeAppointmentId)
    .single()

  if (!appointment || appointment.patient_id !== user.id) {
    redirect('/patient')
  }

  const amountCents = appointment.payment_amount_cents ?? 0

  async function startCheckout() {
    'use server'
    const result = await initiateAppointmentCheckout(safeAppointmentId, { regenerate: true })
    if (result.error || !result.checkoutUrl) {
      throw new Error(result.error || 'Unable to start checkout')
    }
    redirect(result.checkoutUrl)
  }

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Complete Your Payment</h1>
        <p className="text-muted-foreground mt-2">Finish checkout to confirm your appointment.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment</CardTitle>
          <CardDescription>Doctor and schedule details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Doctor</p>
              <p className="font-semibold text-foreground">Dr. {appointment.doctor?.full_name}</p>
            </div>
            <Badge variant="secondary">{appointment.status === 'awaiting_payment' ? 'Awaiting Payment' : appointment.status}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium text-foreground">{new Date(appointment.appointment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="font-medium text-foreground">{appointment.start_time?.substring(0, 5)} - {appointment.end_time?.substring(0, 5)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
          <CardDescription>Stripe sandbox checkout (LKR)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Appointment Fee</p>
            <p className="text-xl font-semibold text-foreground">{formatLkr(amountCents)}</p>
          </div>
          <form action={startCheckout} className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" className="flex-1">Pay with Stripe</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
