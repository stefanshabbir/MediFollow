
import { AppointmentNode, buildAppointmentTree } from '@/utils/appointment-utils'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CancelAppointmentButton } from '@/components/cancel-appointment-button'
import { ChevronRight, CornerDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PatientAppointmentListProps {
    appointments: any[]
    type: 'upcoming' | 'past'
}

function AppointmentNodeItem({ node, type, depth = 0 }: { node: AppointmentNode, type: 'upcoming' | 'past', depth?: number }) {
    const isPast = type === 'past'
    const hasChildren = node.children && node.children.length > 0

    return (
        <div className="relative">
            {/* Connector Line for children */}
            {depth > 0 && (
                <div
                    className="absolute -left-4 top-0 bottom-0 w-px bg-border group-last:h-6"
                    aria-hidden="true"
                />
            )}

            {/* Current Appointment Card */}
            <div className={cn(
                "relative flex items-center justify-between p-4 rounded-lg border bg-card transition-colors",
                depth > 0 ? "ml-8 mt-2" : "mb-2",
                isPast ? "bg-muted/20 hover:bg-muted/30" : "hover:bg-muted/30"
            )}>
                {/* Visual Connector to parent */}
                {depth > 0 && (
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 flex items-center justify-center bg-background z-10">
                        <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                )}

                <div className="space-y-1">
                    <p className="font-semibold text-foreground flex items-center gap-2">
                        Dr. {node.doctor?.full_name}
                        {depth > 0 && (
                            <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                Follow-up
                            </span>
                        )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {new Date(node.appointment_date).toLocaleDateString('en-US', {
                            weekday: isPast ? undefined : 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                        {!isPast && ` at ${node.start_time.substring(0, 5)}`}
                    </p>
                    {node.notes && (
                        <p className="text-sm text-muted-foreground mt-1 italic">
                            "{node.notes}"
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    {isPast ? (
                        <span className="inline-flex items-center rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2.5 py-1 text-xs font-semibold">
                            {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
                        </span>
                    ) : (
                        <StatusBadge status={node.status as any} />
                    )}

                    {/* Actions */}
                    {isPast ? (
                        <Button asChild size="sm" variant="outline">
                            <Link href={`/patient/book?doctorId=${node.doctor_id}&previousAppointmentId=${node.id}`}>
                                Book Follow-up
                            </Link>
                        </Button>
                    ) : (
                        <CancelAppointmentButton id={node.id} />
                    )}
                </div>
            </div>

            {/* Recursive Children */}
            {hasChildren && (
                <div className="relative">
                    {/* Vertical line connecting children */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                    <div className="flex flex-col">
                        {node.children.map(child => (
                            <AppointmentNodeItem key={child.id} node={child} type={type} depth={depth + 1} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export function PatientAppointmentList({ appointments, type }: PatientAppointmentListProps) {
    const tree = buildAppointmentTree(appointments)

    if (tree.length === 0) {
        if (type === 'upcoming') {
            return (
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                        You have no upcoming appointments. Book your first appointment to get started.
                    </p>
                    <Button asChild variant="outline">
                        <Link href="/patient/book">Book Appointment</Link>
                    </Button>
                </div>
            )
        }
        return null
    }

    return (
        <div className="space-y-4">
            {tree.map(node => (
                <AppointmentNodeItem key={node.id} node={node} type={type} />
            ))}
        </div>
    )
}
