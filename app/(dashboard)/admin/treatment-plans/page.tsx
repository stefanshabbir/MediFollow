import { getAllDiagnoses } from "@/app/actions/admin-treatment-plans"
import { TreatmentPlanManager } from "@/components/admin/TreatmentPlanManager"

export default async function AdminTreatmentPlansPage() {
    const { data: diagnoses } = await getAllDiagnoses()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Treatment Plans</h1>
                <p className="text-muted-foreground">Manage diagnoses and their treatment templates</p>
            </div>

            <TreatmentPlanManager initialDiagnoses={diagnoses || []} />
        </div>
    )
}
