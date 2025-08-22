import { UserRole } from '@prisma/client'

// Type for client with roles
export type ClientWithRoles = {
    id: string
    first_name?: string | null
    last_name?: string | null
    roles: UserRole[]
    // ... other fields
}

// Utility functions for working with multiple roles
export const roleUtils = {
    // Check if a client has a specific role
    hasRole: (client: ClientWithRoles, role: UserRole): boolean => {
        return client.roles.includes(role)
    },

    // Check if a client has any of the specified roles
    hasAnyRole: (client: ClientWithRoles, roles: UserRole[]): boolean => {
        return roles.some(role => client.roles.includes(role))
    },

    // Check if a client has all of the specified roles
    hasAllRoles: (client: ClientWithRoles, roles: UserRole[]): boolean => {
        return roles.every(role => client.roles.includes(role))
    },

    // Get the highest priority role (assuming SystemAdmin > Owner > Admin > Client)
    getHighestRole: (client: ClientWithRoles): UserRole => {
        const rolePriority = {
            [UserRole.SystemAdmin]: 4,
            [UserRole.Trainer]: 3,
            [UserRole.Admin]: 2,
            [UserRole.Client]: 1,
        }

        return client.roles.reduce((highest, current) => {
            return rolePriority[current] > rolePriority[highest] ? current : highest
        }, client.roles[0])
    },

    // Add a role to a client
    addRole: (client: ClientWithRoles, role: UserRole): UserRole[] => {
        if (!client.roles.includes(role)) {
            return [...client.roles, role]
        }
        return client.roles
    },

    // Remove a role from a client
    removeRole: (client: ClientWithRoles, role: UserRole): UserRole[] => {
        return client.roles.filter(r => r !== role)
    },

    // Get role display name
    getRoleDisplayName: (role: UserRole): string => {
        const displayNames = {
            [UserRole.SystemAdmin]: 'System Administrator',
            [UserRole.Trainer]: 'Trainer',
            [UserRole.Admin]: 'Administrator',
            [UserRole.Client]: 'Client',
        }
        return displayNames[role]
    },

    // Get all available roles
    getAllRoles: (): UserRole[] => {
        return Object.values(UserRole)
    },
}

// Example usage functions
export const exampleUsage = {
    // Example: Create a client with multiple roles
    createClientWithRoles: async (prisma: any, clientData: any, roles: UserRole[]) => {
        return await prisma.client.create({
            data: {
                ...clientData,
                roles,
            },
        })
    },

    // Example: Update client roles
    updateClientRoles: async (prisma: any, clientId: string, roles: UserRole[]) => {
        return await prisma.client.update({
            where: { id: clientId },
            data: { roles },
        })
    },

    // Example: Add a role to existing client
    addRoleToClient: async (prisma: any, clientId: string, role: UserRole) => {
        const client = await prisma.client.findUnique({
            where: { id: clientId },
        })

        if (!client) throw new Error('Client not found')

        const updatedRoles = roleUtils.addRole(client, role)

        return await prisma.client.update({
            where: { id: clientId },
            data: { roles: updatedRoles },
        })
    },

    // Example: Remove a role from client
    removeRoleFromClient: async (prisma: any, clientId: string, role: UserRole) => {
        const client = await prisma.client.findUnique({
            where: { id: clientId },
        })

        if (!client) throw new Error('Client not found')

        const updatedRoles = roleUtils.removeRole(client, role)

        return await prisma.client.update({
            where: { id: clientId },
            data: { roles: updatedRoles },
        })
    },

    // Example: Find clients with specific roles
    findClientsWithRole: async (prisma: any, role: UserRole) => {
        return await prisma.client.findMany({
            where: {
                roles: {
                    has: role,
                },
            },
        })
    },

    // Example: Find clients with any of the specified roles
    findClientsWithAnyRole: async (prisma: any, roles: UserRole[]) => {
        return await prisma.client.findMany({
            where: {
                roles: {
                    hasSome: roles,
                },
            },
        })
    },
} 