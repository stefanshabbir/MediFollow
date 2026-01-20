
import { AppointmentNode, buildAppointmentTree } from '@/utils/appointment-utils'
import { CornerDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DoctorAppointmentListProps {
    appointments: any[]
}

function AppointmentNodeItem({ node, depth = 0 }: { node: AppointmentNode, depth?: number }) {
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
                "relative flex items-center justify-between p-4 border-b hover:bg-muted/50 transition-colors",
                depth > 0 ? "ml-8 border-l border-t border-r rounded-lg my-2 bg-muted/20" : "",
            )}>
                {/* Visual Connector to parent */}
                {depth > 0 && (
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 flex items-center justify-center bg-background z-10">
                        <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                )}

                <div className="space-y-1">
                    <p className="font-medium text-foreground flex items-center gap-2">
                        {new Date(node.appointment_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}
                        {depth > 0 && (
                            <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                Follow-up
                            </span>
                        )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {node.start_time.slice(0, 5)} - {node.end_time.slice(0, 5)}
                    </p>
                    {node.notes && <p className="text-xs text-muted-foreground line-clamp-1 italic">"{node.notes}"</p>}
                </div>

                <div className={`px-2 py-1 rounded-full text-xs capitalize ${node.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100' :
                    node.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' :
                        node.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100'
                    }`}>
                    {node.status}
                </div>
            </div>

            {/* Recursive Children */}
            {hasChildren && (
                <div className="relative">
                    {/* Vertical line connecting children */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                    <div className="flex flex-col">
                        {node.children.map(child => (
                            <AppointmentNodeItem key={child.id} node={child} depth={depth + 1} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export function DoctorAppointmentList({ appointments }: DoctorAppointmentListProps) {
    const tree = buildAppointmentTree(appointments)

    if (tree.length === 0) {
        return (
            <div className="p-6 text-center text-muted-foreground">
                No appointment history found.
            </div>
        )
    }

    return (
        <div className="divide-y-0">
            {/* Remove divide-y because nested div structure handles borders differently */}
            {tree.map(node => (
                <AppointmentNodeItem key={node.id} node={node} />
            ))}
        </div>
    )
}
