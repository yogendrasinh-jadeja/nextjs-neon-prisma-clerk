import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const webhookSecret = process.env.WEBHOOK_SECRET
    if (!webhookSecret) {
        throw new Error("please add webhook secret in env file")
    }

    const headerPayload = await headers();
    const svixId = headerPayload.get("svix-id");
    const svixTimestamp = headerPayload.get("svix-timestamp");
    const svixSignature = headerPayload.get("svix-signature");


    if (!svixId || !svixTimestamp || !svixSignature) {
        return NextResponse.json(
            { error: "Missing required Svix headers." },
            { status: 400 }
        );
    }

    const payload = await req.json()
    const body = JSON.stringify(payload)

    const wh = new Webhook(webhookSecret);

    let evt: WebhookEvent

    try {
        evt = wh.verify(body, {
            "svix-id": svixId,
            "svix-timestamp": svixTimestamp,
            "svix-signature": svixSignature
        }) as WebhookEvent
    } catch (error) {
        console.error("Error verifying webhook")
        return NextResponse.json(
            { error: "Error verifying webhook" },
            { status: 400 }
        );
    }

    const { id } = evt.data
    const eventType = evt.type

    if (eventType === "user.created") {
        try {
            const { email_addresses, primary_email_address_id } = evt.data
            const primaryEmail = email_addresses?.find(email => email?.id === primary_email_address_id)
            if (!primaryEmail) {
                return NextResponse.json(
                    { error: "No primary email found" },
                    { status: 400 }
                );
            }

            const newUser = await prisma.user.create({
                data: {
                    id: evt.data.id,
                    email: primaryEmail.email_address,
                    isSubscribed: false
                }
            })

            console.log(newUser, "newUser");

        } catch (error) {
            return NextResponse.json(
                { error: "Error creating user in database" },
                { status: 400 }
            );
        }
    }

    return NextResponse.json(
        { error: "webhook received successfully" },
        { status: 200 }
    );
}