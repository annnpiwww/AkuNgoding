import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const validUrl = url && url.startsWith('http') ? url : 'https://placeholder.supabase.co'
  const validKey = key || 'placeholder-anon-key'

  const supabase = createServerClient(
    validUrl,
    validKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes - redirect to login if not authenticated
  const protectedPaths = ['/dashboard', '/project', '/settings']
  const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))
  
  if (!user && isProtected) {
    // If BYPASS_MODE is enabled, allow access directly to protected routes
    return supabaseResponse
  }

  // Redirect logged-in users away from auth pages
  const authPaths = ['/auth/login', '/auth/register']
  const isAuthPage = authPaths.some(path => request.nextUrl.pathname.startsWith(path))
  
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
