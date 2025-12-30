
import { getOrganisationPatients } from '@/app/actions/records'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { User } from 'lucide-react'

export default async function AdminPatientsPage() {
    const { data: patients, error } = await getOrganisationPatients()

    if (error) {
        return (
            <div className="p-4">
                <div className="text-destructive">Error loading patients: {error}</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
                <p className="text-muted-foreground mt-1">
                    View and manage patients across the organization
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Organisation Patients ({patients?.length || 0})</CardTitle>
                    <CardDescription>
                        List of patients booked with any doctor in the organisation
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!patients || patients.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No patients found.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {patients.map((patient: any) => (
                                <Card key={patient.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="p-6 flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <User className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">{patient.full_name || 'Unknown User'}</h3>
                                                <p className="text-sm text-muted-foreground capitalize">{patient.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-6 pb-6 pt-0">
                                        <Button asChild className="w-full">
                                            <Link href={`/admin/patients/${patient.id}`}>
                                                View Records
                                            </Link>
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
