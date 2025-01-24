import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher(['/', '/api/webhooks/register', '/sign-in', '/sign-up'])
const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isDashboardRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth()

    if (userId) {
        const client = await clerkClient()
        const user = await client.users?.getUser(userId);
        const role = user.publicMetadata.role as string | undefined

        // Handle authenticated users
        if (isPublicRoute(req)) {
            return NextResponse.redirect(
                new URL(role === "admin" ? "/admin/dashboard" : "/dashboard", req.url)
            )
        }

        // Handle admin routes 
        if (isAdminRoute(req) && role !== "admin") {
            return NextResponse.redirect(new URL("/dashboard", req.url))
        }

        // Redirect admin to admin dashboard
        if (isDashboardRoute(req) && role === "admin") {
            return NextResponse.redirect(new URL("/admin/dashboard", req.url))
        }
    }

    // Protect all non-public routes
    if (!userId && !isPublicRoute(req)) {
        return NextResponse.redirect(new URL("/sign-in", req.url));
    }
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}