import { and, asc, desc, eq } from "drizzle-orm"
import { CfoInvite, cfoInviteInsertSchema, cfoInvitesTable } from "../../Data/Cfo/CfoInvite.js"
import {
    CfoMembership,
    cfoMembershipInsertSchema,
    cfoMembershipsTable,
    CfoRole,
} from "../../Data/Cfo/CfoMembership.js"
import { cfoDb } from "../../Data/CfoDatabase.js"
import { idempotentInsertAndGet, updateRowReturning } from "../../Data/Utils/index.js"
import { RpcError } from "../../Utils/RpcError.js"
import { userService } from "../Identity/index.js"
import { mailService } from "../Mail/MailService.js"

/**
 * The CFO practice domain: app-level ADVISOR/CLIENT roles plus email invites,
 * on top of the identity kernel. The practice is the workspace, so membership
 * is one row per user, resolved lazily the first time a signed-in user
 * touches the CFO surface:
 *
 * - an existing membership wins;
 * - a PENDING invite matching the user's email is accepted into a CLIENT
 *   membership (no token round-trip — the invitee signs up through the
 *   normal auth surface with the invited address);
 * - the first user ever becomes the ADVISOR (the practice owner);
 * - anyone else self-serves as a CLIENT, so the demo path never dead-ends.
 */
class CfoService {
    /** The user's membership, or undefined before their first ensureMembership. */
    async getMembershipForUser(userId: string): Promise<CfoMembership | undefined> {
        const [membership] = await cfoDb
            .select()
            .from(cfoMembershipsTable)
            .where(eq(cfoMembershipsTable.userId, userId))
            .limit(1)
        return membership
    }

    /** Resolves (creating if needed) the signed-in user's membership. */
    async ensureMembership(request: EnsureMembershipRequest): Promise<CfoMembership> {
        const existing = await this.getMembershipForUser(request.userId)
        if (existing !== undefined) {
            return existing
        }

        const email = request.email.trim().toLowerCase()
        const [pendingInvite] = await cfoDb
            .select()
            .from(cfoInvitesTable)
            .where(and(eq(cfoInvitesTable.email, email), eq(cfoInvitesTable.status, "PENDING")))
            .orderBy(asc(cfoInvitesTable.rowCreatedAt))
            .limit(1)

        let role: CfoRole
        let invitedByUserId: string | undefined
        if (pendingInvite !== undefined) {
            role = pendingInvite.role
            invitedByUserId = pendingInvite.invitedByUserId
        } else {
            const [anyMembership] = await cfoDb.select().from(cfoMembershipsTable).limit(1)
            role = anyMembership === undefined ? "ADVISOR" : "CLIENT"
        }

        const newMembership = cfoMembershipInsertSchema.parse({
            userId: request.userId,
            role,
            invitedByUserId: invitedByUserId ?? null,
        })
        const membership = await idempotentInsertAndGet(
            cfoDb,
            cfoMembershipsTable,
            newMembership,
            `cfo-membership-${request.userId}`,
        )
        if (pendingInvite !== undefined) {
            await updateRowReturning(cfoDb, cfoInvitesTable, pendingInvite.id, {
                status: "ACCEPTED",
                acceptedByUserId: request.userId,
            })
        }
        return membership
    }

    /** Every membership, advisor first then clients by join date (advisor-only). */
    async listMemberships(actorUserId: string): Promise<CfoMembership[]> {
        await this.requireAdvisor(actorUserId)
        return await cfoDb.select().from(cfoMembershipsTable).orderBy(asc(cfoMembershipsTable.rowCreatedAt))
    }

    /** Client memberships only — the advisor's roster. */
    async listClientMemberships(actorUserId: string): Promise<CfoMembership[]> {
        await this.requireAdvisor(actorUserId)
        return await cfoDb
            .select()
            .from(cfoMembershipsTable)
            .where(eq(cfoMembershipsTable.role, "CLIENT"))
            .orderBy(asc(cfoMembershipsTable.rowCreatedAt))
    }

    /**
     * Invites an email into the practice as a CLIENT (advisor-only) and
     * sends the invite email (best-effort — mail degrades, the invite row
     * is the source of truth). Re-inviting a PENDING email returns the
     * existing invite instead of duplicating it.
     */
    async inviteClient(request: InviteClientRequest): Promise<CfoInvite> {
        const advisor = await this.requireAdvisor(request.actorUserId)
        const email = request.email.trim().toLowerCase()

        const invitedUser = await userService.getUserByEmail(email)
        if (invitedUser !== undefined) {
            const membership = await this.getMembershipForUser(invitedUser.id)
            if (membership !== undefined) {
                throw new RpcError("ALREADY_EXISTS", `${email} is already a member of the practice.`)
            }
        }
        const [pending] = await cfoDb
            .select()
            .from(cfoInvitesTable)
            .where(and(eq(cfoInvitesTable.email, email), eq(cfoInvitesTable.status, "PENDING")))
            .limit(1)
        if (pending !== undefined) {
            return pending
        }

        const newInvite = cfoInviteInsertSchema.parse({
            email,
            role: "CLIENT",
            status: "PENDING",
            invitedByUserId: advisor.userId,
        })
        const invite = await idempotentInsertAndGet(cfoDb, cfoInvitesTable, newInvite, request.idempotencyKey)

        const advisorUser = await userService.getUserByIdOrThrow(advisor.userId)
        await mailService.sendTemplatedMail({
            toEmail: email,
            templateKey: "cfoClientInvite",
            variables: {
                advisorName: advisorUser.displayName,
                siteName: request.siteName,
                signInUrl: request.signInUrl,
            },
        })
        return invite
    }

    /** Every invite, newest first (advisor-only). */
    async listInvites(actorUserId: string): Promise<CfoInvite[]> {
        await this.requireAdvisor(actorUserId)
        return await cfoDb.select().from(cfoInvitesTable).orderBy(desc(cfoInvitesTable.rowCreatedAt))
    }

    /** Revokes a PENDING invite (advisor-only). Idempotent on already-revoked. */
    async revokeInvite(request: { actorUserId: string; inviteId: string }): Promise<CfoInvite> {
        await this.requireAdvisor(request.actorUserId)
        const [invite] = await cfoDb
            .select()
            .from(cfoInvitesTable)
            .where(eq(cfoInvitesTable.id, request.inviteId))
            .limit(1)
        if (invite === undefined) {
            throw new RpcError("NOT_FOUND", "There is no such invite.")
        }
        if (invite.status === "ACCEPTED") {
            throw new RpcError("FAILED_PRECONDITION", "This invite was already accepted.")
        }
        if (invite.status === "REVOKED") {
            return invite
        }
        return await updateRowReturning(cfoDb, cfoInvitesTable, invite.id, { status: "REVOKED" })
    }

    /**
     * Authorizes reading a client's books: the advisor sees every client;
     * a client sees only themself.
     */
    async requireCanViewClient(actorUserId: string, clientUserId: string): Promise<void> {
        if (actorUserId === clientUserId) {
            return
        }
        const membership = await this.getMembershipForUser(actorUserId)
        if (membership?.role !== "ADVISOR") {
            throw new RpcError("PERMISSION_DENIED", "Only the advisor may view another member's books.")
        }
    }

    /** The actor's membership, asserting the ADVISOR role. */
    async requireAdvisor(actorUserId: string): Promise<CfoMembership> {
        const membership = await this.getMembershipForUser(actorUserId)
        if (membership === undefined || membership.role !== "ADVISOR") {
            throw new RpcError("PERMISSION_DENIED", "This operation is for the practice's advisor.")
        }
        return membership
    }
}

export const cfoService = new CfoService()

export interface EnsureMembershipRequest {
    userId: string
    /** The signed-in user's email, for pending-invite resolution. */
    email: string
}

export interface InviteClientRequest {
    idempotencyKey: string
    actorUserId: string
    email: string
    /** The product name for the invite email (the composed site's name). */
    siteName: string
    /** Where the invite email's button points (the composed site's /login). */
    signInUrl: string
}
