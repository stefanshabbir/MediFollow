import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organisations(*)')
    .eq('id', user?.id)
    .single()

  const { data: doctors } = await supabase
    .from('profiles')
    .select('*')
    .eq('organisation_id', profile?.organisation_id)
    .eq('role', 'doctor')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile?.full_name}
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/admin/invite">Invite Doctor</Link>
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Organisation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{profile?.organisations?.name}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Admin: {profile?.full_name}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Total Doctors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{doctors?.length || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Active members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Active</div>
            <p className="text-sm text-muted-foreground mt-1">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Doctors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Doctors</CardTitle>
          <CardDescription>
            Manage your organisation's medical staff
          </CardDescription>
        </CardHeader>
        <CardContent>
          {doctors && doctors.length > 0 ? (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-card">
                  {doctors.map((doctor: any) => (
                    <tr key={doctor.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {doctor.full_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        Doctor
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                No doctors found. Invite your first doctor to get started.
              </p>
              <Button asChild variant="outline">
                <Link href="/admin/invite">Invite Doctor</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
