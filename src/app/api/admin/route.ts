import { clerkClient } from "@clerk/nextjs/server";

async function isAdmin(userId: string) {
    const clerk = await clerkClient(); // Await clerkClient to get the actual client
    const user = await clerk.users.getUser(userId); // Correct method name: getUser}
    return user.privateMetadata.role === "admin"
}