import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import DOMPurify from 'isomorphic-dompurify'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !profile) {
        notFound()
    }

    // PM-030: Soft Delete check
    if (profile.is_deleted) {
        return <div className="container mx-auto py-20 text-center">User not found</div>
    }

    // PM-016: Privacy Check
    if (!profile.preferences?.privacy_settings?.is_public) {
        return <div className="container mx-auto py-20 text-center">This profile is private.</div>
    }

    // PM-024: Output Sanitation (Double check, though we sanitize on input)
    const safeBio = DOMPurify.sanitize(profile.bio || "")
    const safeName = DOMPurify.sanitize(profile.full_name || "User")

    return (
        <div className="container mx-auto py-10 px-4 max-w-2xl">
            <Card>
                <CardHeader className="flex flex-col items-center gap-4">
                    <Avatar className="h-32 w-32">
                        {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
                        <AvatarFallback>{safeName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                        <CardTitle className="text-2xl">{safeName}</CardTitle>
                        {profile.role === 'doctor' && (
                            <p className="text-muted-foreground mt-1">{profile.specialization}</p>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {safeBio && (
                        <div className="prose dark:prose-invert max-w-none">
                            <h3>About</h3>
                            <p>{safeBio}</p>
                        </div>
                    )}

                    {/* PM-013: Specialization/Certs for Doctors */}
                    {profile.role === 'doctor' && profile.certifications?.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-medium mb-2">Qualifications</h3>
                            <ul className="list-disc pl-5">
                                {/* Render certs logic */}
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
