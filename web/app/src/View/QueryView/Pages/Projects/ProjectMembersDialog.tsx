import { Button, Dialog, Select, Spinner } from "@ui"
import React, { useMemo, useState } from "react"
import {
    ProjectMembershipRole,
    useAddProjectMemberMutation,
    useProjectMembersQuery,
    useRemoveProjectMemberMutation,
    useUpdateProjectMemberMutation,
    useUsersQuery,
} from "../../../../generated/graphql/types"
import * as styles from "./ProjectMembersDialog.styles.css"

const ROLE_OPTIONS = [
    { value: "OWNER", label: "Owner" },
    { value: "EDITOR", label: "Editor" },
    { value: "VIEWER", label: "Viewer" },
]

export interface ProjectMembersDialogProps {
    projectId: string
    onClose: () => void
}

/**
 * Membership management for one project: list members with their role,
 * change a role, remove a member, and add a new member. Role changes and
 * removals are OWNER-only on the backend (docs/authorization.md), so errors
 * from insufficient roles surface inline.
 */
export function ProjectMembersDialog({ projectId, onClose }: ProjectMembersDialogProps): React.ReactElement {
    const [error, setError] = useState<string>()
    const [addUserId, setAddUserId] = useState("")
    const [addRole, setAddRole] = useState<ProjectMembershipRole>("VIEWER")

    const membersQuery = useProjectMembersQuery({
        variables: { id: projectId },
        fetchPolicy: "network-only",
    })
    // Candidate users for the add-member picker (starter-scale: first page,
    // sorted by name; already-added members are filtered out below).
    const usersQuery = useUsersQuery({
        variables: {
            input: {
                connection: {
                    pagination: { first: 50 },
                    sort: [{ fieldName: "displayName", direction: "asc" }],
                },
            },
        },
    })

    const [addMember, addState] = useAddProjectMemberMutation()
    const [updateMember, updateState] = useUpdateProjectMemberMutation()
    const [removeMember, removeState] = useRemoveProjectMemberMutation()

    const project = membersQuery.data?.project
    const memberships = useMemo(() => project?.memberships ?? [], [project])

    const candidateUsers = useMemo(() => {
        const memberUserIds = new Set(memberships.map((membership) => membership.user.id))
        return (usersQuery.data?.users.nodes ?? []).flatMap((user) =>
            user && !memberUserIds.has(user.id) ? [user] : [],
        )
    }, [usersQuery.data, memberships])

    const mutating = addState.loading || updateState.loading || removeState.loading

    const runMutation = async (mutation: () => Promise<unknown>): Promise<void> => {
        setError(undefined)
        try {
            await mutation()
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "The change failed.")
        }
    }

    const changeRole = (membershipId: string, role: string): void => {
        void runMutation(() =>
            updateMember({
                variables: {
                    input: {
                        objectId: membershipId,
                        idempotencyKey: crypto.randomUUID(),
                        fields: { role: role as ProjectMembershipRole },
                    },
                },
                refetchQueries: ["ProjectMembers"],
            }),
        )
    }

    const remove = (membershipId: string): void => {
        void runMutation(() =>
            removeMember({
                variables: { input: { objectId: membershipId } },
                refetchQueries: ["ProjectMembers"],
            }),
        )
    }

    const add = (): void => {
        if (addUserId === "") {
            return
        }
        void runMutation(async () => {
            await addMember({
                variables: {
                    input: {
                        idempotencyKey: crypto.randomUUID(),
                        fields: { projectId, userId: addUserId, role: addRole },
                    },
                },
                refetchQueries: ["ProjectMembers"],
            })
            setAddUserId("")
        })
    }

    return (
        <Dialog
            open
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    onClose()
                }
            }}
            title={project ? `Members — ${project.name}` : "Members"}
            description="Owners can add members, change roles, and remove members."
            footer={
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            }
        >
            <div className={styles.body}>
                {membersQuery.loading ? (
                    <div className={styles.loadingRow}>
                        <Spinner size="md" />
                    </div>
                ) : null}
                {membersQuery.error ? <p className={styles.message}>{membersQuery.error.message}</p> : null}

                {!membersQuery.loading && !membersQuery.error ? (
                    <div className={styles.memberList} role="list" aria-label="Project members">
                        {memberships.length === 0 ? (
                            <p className={styles.emptyText}>This project has no members yet.</p>
                        ) : null}
                        {memberships.map((membership) => (
                            <div key={membership.id} className={styles.memberRow} role="listitem">
                                <span className={styles.memberIdentity}>
                                    <span className={styles.memberName}>{membership.user.displayName}</span>
                                    <span className={styles.memberEmail}>{membership.user.email}</span>
                                </span>
                                <span className={styles.roleSelect}>
                                    <Select
                                        value={membership.role}
                                        options={ROLE_OPTIONS}
                                        onValueChange={(role) => changeRole(membership.id, role)}
                                        disabled={mutating}
                                        aria-label={`Role of ${membership.user.displayName}`}
                                    />
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => remove(membership.id)}
                                    disabled={mutating}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : null}

                <h3 className={styles.sectionTitle}>Add a member</h3>
                <div className={styles.addRow}>
                    <span className={styles.userSelect}>
                        <Select
                            value={addUserId}
                            options={candidateUsers.map((user) => ({
                                value: user.id,
                                label: `${user.displayName} (${user.email})`,
                            }))}
                            onValueChange={setAddUserId}
                            placeholder={candidateUsers.length === 0 ? "No users to add" : "Select a user..."}
                            disabled={candidateUsers.length === 0 || mutating}
                            aria-label="User to add"
                        />
                    </span>
                    <span className={styles.roleSelect}>
                        <Select
                            value={addRole}
                            options={ROLE_OPTIONS}
                            onValueChange={(role) => setAddRole(role as ProjectMembershipRole)}
                            disabled={mutating}
                            aria-label="Role for the new member"
                        />
                    </span>
                    <Button onClick={add} disabled={addUserId === "" || mutating}>
                        {addState.loading ? "Adding..." : "Add"}
                    </Button>
                </div>

                {error ? <p className={styles.message}>{error}</p> : null}
            </div>
        </Dialog>
    )
}
