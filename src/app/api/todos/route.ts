import prisma from "@/lib/prisma"
import { auth, currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { title } from "process"

const itemsPerPage = 10

export async function GET(req: NextRequest) {
    const { userId } = await auth()
    if (!userId) {
        return NextResponse.json({ error: "unauthorized", }, { status: 401 })
    }
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || "1")
    const search = searchParams.get("search") || ""
    try {
        const todos = await prisma.todo.findMany({
            where: {
                userId,
                title: {
                    contains: search,
                    mode: 'insensitive'
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            take: itemsPerPage,
            skip: (page - 1) * itemsPerPage
        })

        const totalItems = await prisma.todo.count(
            {
                where: {
                    userId,
                    title: {
                        contains: search,
                        mode: 'insensitive'
                    }
                }
            })

        const totalPages = Math.ceil(totalItems / itemsPerPage)
        return NextResponse.json({ todos, currentPage: page, totalPages }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ error: "Internal server error", }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const { userId } = await auth()
    if (!userId) {
        return NextResponse.json({ error: "unauthorized", }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        include: {
            todos: true
        }
    })
    if (!user) {
        return NextResponse.json({ error: "user not found", }, { status: 404 })
    }

    if (!user.isSubscribed && user.todos.length >= 3) {
        return NextResponse.json({ error: "Free users can only create upto 3 todos. please subcribe to our paid plan to write awesome todos", }, { status: 403 })

    }
    const { title } = await req.json()

    const todo = await prisma.todo.create({
        data: {
            title,
            userId
        }
    })
    return NextResponse.json({ todo }, { status: 201 })
}