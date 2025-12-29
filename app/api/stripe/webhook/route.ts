import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/utils/supabase/service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing Stripe signature or webhook secret' }, { status: 400 })
  }

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed', err)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const appointmentId = session.metadata?.appointmentId

    console.log('Webhook: Processing checkout.session.completed', {
      sessionId: session.id,
      appointmentId,
      paymentIntent: session.payment_intent
    })

    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || session.id

    if (appointmentId) {
      const supabase = createServiceClient()
      const { error, data } = await supabase
        .from('appointments')
        .update({
          payment_status: 'paid',
          // status: 'completed', // CHANGED: 'confirmed' is better for upcoming appointments
          status: 'confirmed',
          paid_at: new Date().toISOString(),
          payment_intent_id: paymentIntentId
        })
        .eq('id', appointmentId)
        .select()

      if (error) {
        console.error('Webhook: Failed to mark appointment paid', error)
        return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
      } else {
        console.log('Webhook: Successfully updated appointment', data)
      }
    } else {
      console.warn('Webhook: No appointmentId found in metadata')
    }
  } else {
    console.log(`Webhook: Unhandled event type ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
