import { getAllDiagnoses } from "@/app/actions/admin-treatment-plans"
import { TreatmentPlanManager } from "@/components/admin/TreatmentPlanManager"

export default async function DoctorTreatmentPlansPage() {
    // Doctors can see all diagnoses/templates for now, as they are likely shared.
    // If they need to be private to the doctor, we'd need to update the queries.
    // For now, reuse the admin action which fetches all.
    const { data: diagnoses } = await getAllDiagnoses()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Treatment Plan Templates</h1>
                <p className="text-muted-foreground">Manage diagnoses and treatment protocols</p>
            </div>

            <TreatmentPlanManager initialDiagnoses={diagnoses || []} />
        </div>
    )
}
