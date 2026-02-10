import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'

export const dynamic = "force-dynamic";

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Payment received</CardTitle>
          <CardDescription>Your appointment has been confirmed. You can view details in your dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Link href="/patient" className={buttonVariants()}>
            Back to dashboard
          </Link>
          <Link href="/patient/book" className={buttonVariants({ variant: "outline" })}>
            Book another appointment
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
