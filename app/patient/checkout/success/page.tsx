import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Payment received</CardTitle>
          <CardDescription>Your appointment has been confirmed. You can view details in your dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button asChild>
            <Link href="/patient">Back to dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/patient/book">Book another appointment</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
