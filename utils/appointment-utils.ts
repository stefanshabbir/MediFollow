
export interface Appointment {
    id: string
    previous_appointment_id: string | null
    appointment_date: string
    [key: string]: any
}

export interface AppointmentNode extends Appointment {
    children: AppointmentNode[]
}

export function buildAppointmentTree(appointments: Appointment[]): AppointmentNode[] {
    const appointmentMap = new Map<string, AppointmentNode>()
    const roots: AppointmentNode[] = []

    // 1. Create nodes
    appointments.forEach(apt => {
        appointmentMap.set(apt.id, { ...apt, children: [] })
    })

    // 2. Build tree
    // We need to handle cases where parent might not be in the current filtered list (e.g. upcoming/past split).
    // If parent is missing, treat as root for this view?
    // Or should we try to find the "topmost" visible ancestor?

    // Simple approach: If previous_appointment_id exists AND exists in our map, attach it.
    // If previous_appointment_id exists but NOT in map, it's a root of this specific disjoint graph.

    // Sort by date to ensure order (optional but good)
    const sortedAppointments = [...appointments].sort((a, b) =>
        new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
    )

    sortedAppointments.forEach(apt => {
        const node = appointmentMap.get(apt.id)!
        if (apt.previous_appointment_id && appointmentMap.has(apt.previous_appointment_id)) {
            const parent = appointmentMap.get(apt.previous_appointment_id)
            parent?.children.push(node)
        } else {
            roots.push(node)
        }
    })

    // Sort roots by date descending (for most recent first lists) or ascending
    // User usually wants to see latest first? Or oldest first for a timeline?
    // "Upcoming" -> Ascending (nearest future first)
    // "History" -> Descending (most recent past first)
    // The lists in Dashboard are already filtered and likely sorted.
    // Let's defer sorting to the component usage.

    return roots
}
