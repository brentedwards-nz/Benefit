'use client'

import { useState } from 'react'
import { UserRole } from '@prisma/client'
import { roleUtils } from '@/utils/role-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

interface ClientWithRoles {
    id: string
    firstName?: string | null
    lastName?: string | null
    roles: UserRole[]
}

interface RoleManagerProps {
    client: ClientWithRoles
    onRolesUpdate?: (clientId: string, newRoles: UserRole[]) => void
}

export function RoleManager({ client, onRolesUpdate }: RoleManagerProps) {
    const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(client.roles)

    const handleRoleToggle = (role: UserRole, checked: boolean) => {
        if (checked) {
            setSelectedRoles(prev => [...prev, role])
        } else {
            setSelectedRoles(prev => prev.filter(r => r !== role))
        }
    }

    const handleSave = () => {
        onRolesUpdate?.(client.id, selectedRoles)
    }

    const handleReset = () => {
        setSelectedRoles(client.roles)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Role Management for {client.firstName} {client.lastName}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Roles Display */}
                <div>
                    <h4 className="font-medium mb-2">Current Roles:</h4>
                    <div className="flex flex-wrap gap-2">
                        {client.roles.map(role => (
                            <Badge key={role} variant="secondary">
                                {roleUtils.getRoleDisplayName(role)}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Role Selection */}
                <div>
                    <h4 className="font-medium mb-2">Select Roles:</h4>
                    <div className="space-y-2">
                        {roleUtils.getAllRoles().map(role => (
                            <div key={role} className="flex items-center space-x-2">
                                <Checkbox
                                    id={role}
                                    checked={selectedRoles.includes(role)}
                                    onCheckedChange={(checked) =>
                                        handleRoleToggle(role, checked as boolean)
                                    }
                                />
                                <label htmlFor={role} className="text-sm font-medium">
                                    {roleUtils.getRoleDisplayName(role)}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} disabled={selectedRoles.length === 0}>
                        Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                        Reset
                    </Button>
                </div>

                {/* Role Information */}
                <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Role Information:</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p>• <strong>System Administrator:</strong> Full system access</p>
                        <p>• <strong>Owner:</strong> Business owner privileges</p>
                        <p>• <strong>Administrator:</strong> Management capabilities</p>
                        <p>• <strong>Client:</strong> Regular user access</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Example usage component
export function ClientRoleExample() {
    const [clients, setClients] = useState<ClientWithRoles[]>([
        {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            roles: [UserRole.Client, UserRole.Admin],
        },
        {
            id: '2',
            firstName: 'Jane',
            lastName: 'Smith',
            roles: [UserRole.Admin],
        },
    ])

    const handleRolesUpdate = (clientId: string, newRoles: UserRole[]) => {
        setClients(prev =>
            prev.map(client =>
                client.id === clientId
                    ? { ...client, roles: newRoles }
                    : client
            )
        )
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Client Role Management</h2>

            {clients.map(client => (
                <RoleManager
                    key={client.id}
                    client={client}
                    onRolesUpdate={handleRolesUpdate}
                />
            ))}
        </div>
    )
} 