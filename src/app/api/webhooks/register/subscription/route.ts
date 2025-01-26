import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST() {
    const { userId } = await auth()
    if (!userId) {
        return NextResponse.json({ error: "unauthorized", }, { status: 401 })
    }
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) {
            return NextResponse.json({ error: "user not found", }, { status: 401 })
        }
        const subscriptionEnds = new Date()
        subscriptionEnds.setMonth(subscriptionEnds.getMonth() + 1)
        const updatedUser = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                isSubscribed: true,
                subscriptionsEnd: subscriptionEnds
            }
        })
        return NextResponse.json({
            message: "Subscription successfully",
            subscriptionEnds: updatedUser.subscriptionsEnd
        }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ error: "Internal server error", }, { status: 500 })

    }
}

export async function GET() {

}