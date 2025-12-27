import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new Response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/auth') &&
        !request.nextUrl.pathname.startsWith('/register') &&
        !request.nextUrl.pathname.startsWith('/register-org') &&
        !request.nextUrl.pathname.startsWith('/set-password') &&
        !request.nextUrl.pathname.startsWith('/api/test-email') &&
        request.nextUrl.pathname !== '/'
    ) {
        // no user, potentially respond by redirecting the user to the login page
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (user) {
        // Fetch user profile to get role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile) {
            const role = profile.role
            const path = request.nextUrl.pathname

            // Redirect from root to dashboard
            if (path === '/') {
                const url = request.nextUrl.clone()
                if (role === 'admin') url.pathname = '/admin'
                else if (role === 'doctor') url.pathname = '/doctor'
                else if (role === 'patient') url.pathname = '/patient'
                return NextResponse.redirect(url)
            }

            // Protect routes
            if (path.startsWith('/admin') && role !== 'admin') {
                return NextResponse.redirect(new URL('/', request.url))
            }
            if (path.startsWith('/doctor') && role !== 'doctor') {
                return NextResponse.redirect(new URL('/', request.url))
            }
            if (path.startsWith('/patient') && role !== 'patient') {
                return NextResponse.redirect(new URL('/', request.url))
            }
        }
    }

    return supabaseResponse
}
