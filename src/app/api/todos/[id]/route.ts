import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest, { params }: {
    params: { id: string }
}) {
    const { userId } = await auth()
    if (!userId) {
        return NextResponse.json({ error: "unauthorized", }, { status: 401 })
    }
    try {
        const todoId = params.id
        const todo = await prisma.todo.findUnique({
            where: {
                id: todoId,
                userId
            }
        })
        if (!todo) {
            return NextResponse.json({ error: "todo not found", }, { status: 404 })
        }
        await prisma.todo.delete({
            where: { id: todoId }
        })
        return NextResponse.json({ message: "todo deleted successfully", }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ error: "Internal server error", }, { status: 500 })
    }
}