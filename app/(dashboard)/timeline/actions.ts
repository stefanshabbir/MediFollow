'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export type TimelineEventType = 'appointment' | 'clinical_note' | 'record_update' | 'status_change' | 'profile_update' | 'file_upload'

export interface TimelineEvent {
    id: string
    type: TimelineEventType
    date: string // ISO string
    title: string
    description?: string
    status?: string // For appointments
    metadata?: any // Extra data like doctor name, note content preview, record ID
    referenceId: string // The ID of the original record
    actorName?: string // Who performed the action (Doctor/Patient)
    previousAppointmentId?: string // For chaining
}

export type TimelineFilterOptions = {
    types?: TimelineEventType[]
    search?: string
    startDate?: Date
    endDate?: Date
}

// A Thread represents a group of related events (e.g. Appointment A -> Appointment B)
// Or a single standalone event.
export interface TimelineThread {
    id: string
    latestDate: string
    events: TimelineEvent[]
}


export async function getPatientTimeline(patientId: string, options?: TimelineFilterOptions): Promise<TimelineThread[]> {
    const supabase = await createClient()

    // Get current user to verify access/role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Unauthorized')
    }

    // Verify access (omitted for brevity, same as before)
    if (user.id !== patientId) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role === 'patient') {
            throw new Error('Unauthorized: Patients can only view their own timeline')
        }
    }

    // --- Fetch Appointments ---
    let appointmentsQuery = supabase
        .from('appointments')
        .select(`
      id,
      appointment_date,
      start_time,
      status,
      notes,
      created_at,
      previous_appointment_id,
      doctor:doctor_id(full_name),
      patient:patient_id(full_name)
    `)
        .eq('patient_id', patientId)

    const { data: appointments, error: appError } = await appointmentsQuery as any

    if (appError) throw new Error(`Error fetching appointments: ${appError.message}`)

    // --- Fetch Medical Records (Clinical Notes & Files) ---
    let recordsQuery = supabase
        .from('medical_records')
        .select(`
      id,
      created_at,
      status,
      content,
      file_url,
      file_name,
      doctor_id
    `)
        .eq('patient_id', patientId)

    const { data: records, error: recError } = await recordsQuery as any
    if (recError) throw new Error(`Error fetching medical records: ${recError.message}`)

    // --- Fetch Medical Record Versions (Updates) ---
    const { data: versions, error: verError } = await supabase
        .from('medical_record_versions')
        .select(`
      id,
      created_at,
      content,
      created_by,
      medical_record:medical_records!inner(patient_id)
    `)
        .eq('medical_records.patient_id', patientId)

    if (verError) throw new Error(`Error fetching record versions: ${verError.message}`)

    // --- Map to TimelineEvent ---
    let events: TimelineEvent[] = []

    // 1. Appointments
    const appointmentEventsMap = new Map<string, TimelineEvent>();

    appointments?.forEach((app: any) => {
        const dateTime = `${app.appointment_date}T${app.start_time}`

        const event: TimelineEvent = {
            id: `apt-${app.id}`,
            type: 'appointment',
            date: new Date(dateTime).toISOString(),
            title: `Appointment with Dr. ${Array.isArray(app.doctor) ? app.doctor[0]?.full_name : (app.doctor as any)?.full_name || 'Unknown'}`,
            description: app.notes || undefined,
            status: app.status,
            referenceId: app.id,
            previousAppointmentId: app.previous_appointment_id,
            metadata: {
                doctorName: Array.isArray(app.doctor) ? app.doctor[0]?.full_name : (app.doctor as any)?.full_name,
                appointmentDate: app.appointment_date,
                time: app.start_time
            }
        }

        events.push(event)
        appointmentEventsMap.set(app.id, event)

        // Status Change
        if (app.created_at) {
            // Status changes are treated as separate events but linked to the same reference ID.
            // For grouping, we might want to group status changes WITH the appointment?
            // Current requirement: "appointments and their followups should be linked". 
            // Status changes are strictly chronological log items. 
            // Let's keep status changes as separate events for now unless "Status Change" should be nested inside the appointment card?
            // User asked to separate "non-related appointments". 
            // Let's leave status changes as loose events for now, they add context.
            events.push({
                id: `apt-create-${app.id}`,
                type: 'status_change',
                date: app.created_at,
                title: `Appointment Created`,
                description: `Status: ${app.status}`,
                status: 'created',
                referenceId: app.id,
                metadata: {
                    initialStatus: 'pending'
                }
            })
        }
    })

    // 2. Medical Records
    records?.forEach((rec: any) => {
        const isNote = !!rec.content;
        const isFile = !!rec.file_url;

        if (isNote) {
            events.push({
                id: `rec-${rec.id}`,
                type: 'clinical_note',
                date: rec.created_at,
                title: 'Clinical Note Added',
                description: rec.content ? rec.content.substring(0, 100) + (rec.content.length > 100 ? '...' : '') : undefined,
                status: rec.status,
                referenceId: rec.id,
                metadata: {
                    fullContent: rec.content,
                    doctorId: rec.doctor_id
                }
            })
        }

        if (isFile) {
            events.push({
                id: `file-${rec.id}`,
                type: 'file_upload',
                date: rec.created_at,
                title: 'File Uploaded',
                description: rec.file_name || 'Attached File',
                referenceId: rec.id,
                metadata: {
                    fileUrl: rec.file_url,
                    fileName: rec.file_name
                }
            })
        }
    })

    // 3. Versions
    versions?.forEach((ver: any) => {
        events.push({
            id: `Ver-${ver.id}`,
            type: 'record_update',
            date: ver.created_at,
            title: 'Records Updated',
            description: 'A clinical note was updated.',
            referenceId: (ver.medical_record as any).id || '',
            metadata: {
                contentSnippet: ver.content ? ver.content.substring(0, 50) : ''
            }
        })
    })

    // --- Filtering ---
    if (options?.types && options.types.length > 0) {
        events = events.filter(e => options.types!.includes(e.type))
    }

    if (options?.search) {
        const lowerSearch = options.search.toLowerCase()
        events = events.filter(e =>
            e.title.toLowerCase().includes(lowerSearch) ||
            (e.description && e.description.toLowerCase().includes(lowerSearch)) ||
            (e.metadata?.doctorName && e.metadata.doctorName.toLowerCase().includes(lowerSearch))
        )
    }

    if (options?.startDate) {
        events = events.filter(e => new Date(e.date) >= options.startDate!)
    }
    if (options?.endDate) {
        events = events.filter(e => new Date(e.date) <= options.endDate!)
    }

    // --- Grouping Logic ---
    // We want to group appointments that are linked (Chain).
    // AND all other events as single items.

    // 1. Identify all appointment events that are NOT status changes (main appointment cards).
    const appointmentEvents = events.filter(e => e.type === 'appointment');
    const otherEvents = events.filter(e => e.type !== 'appointment');

    // 2. Build Chains
    // Map appointment ID to its Next appointments (children)
    // Actually, we have previous_id. So Map ID to Children IDs.
    const adjacencyList = new Map<string, string[]>();
    const roots = new Set<string>();

    // Initialize
    appointmentEvents.forEach(e => {
        if (!e.previousAppointmentId) {
            roots.add(e.referenceId); // It's a root
        } else {
            // It has a parent.
            const parentId = e.previousAppointmentId;
            if (!adjacencyList.has(parentId)) adjacencyList.set(parentId, []);
            adjacencyList.get(parentId)!.push(e.referenceId);
        }
    });

    // However, we need to respect the filtered list. 
    // If we filtered out the parent, what happens to the child?
    // Current logic: If we filtered, `appointmentEvents` only contains matches.
    // If Parent is missing from `appointmentEvents`, Child looks like a Root in this context?
    // Or should we display it normally?
    // Let's treat them as roots if their parent is not in the filtered list.

    const appointmentIds = new Set(appointmentEvents.map(e => e.referenceId));

    const threads: TimelineThread[] = [];
    const processedAppointmentIds = new Set<string>();

    // Function to perform DFS/BFS to find all descendants in the filtered set
    const getChain = (startId: string): TimelineEvent[] => {
        const chain: TimelineEvent[] = [];
        const queue = [startId];

        while (queue.length > 0) {
            const currId = queue.shift()!;
            const event = appointmentEventsMap.get(currId);
            if (event && appointmentIds.has(currId)) { // Only include if in filtered list
                chain.push(event);
            }

            if (adjacencyList.has(currId)) {
                // Add children to queue
                const children = adjacencyList.get(currId)!;
                // Sort children by date? usually 1 child, but could be branching?
                // Sort children by date descending?
                // Normally chains are chronological (Old -> New).
                // We'll sort the final chain by date ASCENDING inside the group?
                // User said "linked in the UI... differentiate flows"
                // Usually chains are shown chronological (Parent -> Child).
                children.forEach(childId => queue.push(childId));
            }
        }
        return chain.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

    // Iterate all appointments
    // If an appointment hasn't been processed, try to find its "root" within this set?
    // No, we should find true roots.
    // Ideally we find the true root of the chain.
    // If A -> B -> C and we filter only B and C.
    // B's parent is A (missing). B is the local root.
    // B -> C is the chain.

    appointmentEvents.forEach(e => {
        if (processedAppointmentIds.has(e.referenceId)) return;

        // Is this a generic root?
        // Check if its parent exists in the filtered set.
        let isLocalRoot = true;
        if (e.previousAppointmentId && appointmentIds.has(e.previousAppointmentId)) {
            isLocalRoot = false;
        }

        if (isLocalRoot) {
            // Start chain
            const chain = getChain(e.referenceId);
            chain.forEach(c => processedAppointmentIds.add(c.referenceId));

            if (chain.length > 0) {
                threads.push({
                    id: `thread-${chain[0].id}`,
                    latestDate: chain[chain.length - 1].date, // Use latest date for sorting the WHOLE thread in the timeline
                    events: chain
                });
            }
        }
    });

    // 3. Add other events as single threads
    otherEvents.forEach(e => {
        threads.push({
            id: `thread-${e.id}`,
            latestDate: e.date,
            events: [e]
        });
    });

    // 4. Sort Threads Descending
    threads.sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());

    return threads;
}
