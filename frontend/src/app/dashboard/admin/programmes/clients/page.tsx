'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Search, UserPlus } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { UserRole } from '@prisma/client'

interface ProgrammeEnrolment {
    id: string
    programId: string
    clientId: string
    notes: string | null
    adhocData: any
    createdAt: string
    updatedAt: string
    programmeTemplateId: string | null
    client: {
        id: string
        firstName: string | null
        lastName: string | null
        contactInfo: any
    }
    programme: {
        id: string
        name: string
        humanReadableId: string
        maxClients: number
    }
}

interface Client {
    id: string
    firstName: string | null
    lastName: string | null
    contactInfo: any
    roles: string[]
}

function ProgrammeClientsManagementContent() {
    const { data: session } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const programmeId = searchParams.get('programmeId')
    const programmeName = searchParams.get('programmeName')

    const [enrolments, setEnrolments] = useState<ProgrammeEnrolment[]>([])
    const [availableClients, setAvailableClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        clientId: '',
        notes: '',
        adhocData: {}
    })
    const [isAdding, setIsAdding] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<Client[]>([])
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Fetch programme enrolments
            const enrolmentsResponse = await fetch(`/api/admin/programme-enrolments?programmeId=${programmeId}`)
            if (enrolmentsResponse.ok) {
                const enrolmentsData = await enrolmentsResponse.json()
                setEnrolments(enrolmentsData)
            }

            // Fetch available clients
            const clientsResponse = await fetch('/api/admin/clients')
            if (clientsResponse.ok) {
                const clientsData = await clientsResponse.json()
                setAvailableClients(clientsData)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (enrolment: ProgrammeEnrolment) => {
        setEditingId(enrolment.id)
        setFormData({
            clientId: enrolment.clientId,
            notes: enrolment.notes || '',
            adhocData: enrolment.adhocData || {}
        })
    }

    const handleSave = async () => {
        try {
            if (editingId) {
                // Update existing enrolment
                const response = await fetch(`/api/admin/programme-enrolments/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                })

                if (response.ok) {
                    setEditingId(null)
                    fetchData()
                }
            } else {
                // Create new enrolment
                const response = await fetch('/api/admin/programme-enrolments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        programId: programmeId
                    })
                })

                if (response.ok) {
                    setIsAdding(false)
                    resetForm()
                    fetchData()
                }
            }
        } catch (error) {
            console.error('Error saving programme enrolment:', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this client from the programme?')) return

        try {
            const response = await fetch(`/api/admin/programme-enrolments/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                fetchData()
            }
        } catch (error) {
            console.error('Error deleting programme enrolment:', error)
        }
    }

    const resetForm = () => {
        setFormData({
            clientId: '',
            notes: '',
            adhocData: {}
        })
        setSelectedClient(null)
        setSearchTerm('')
        setSearchResults([])
    }

    const handleAddNew = () => {
        setIsAdding(true)
        setEditingId(null)
        resetForm()
    }

    const handleCancel = () => {
        setIsAdding(false)
        setEditingId(null)
        resetForm()
    }

    const handleSearch = async (searchTerm: string) => {
        setSearchTerm(searchTerm)
        if (searchTerm.length < 2) {
            setSearchResults([])
            return
        }

        try {
            const response = await fetch(`/api/admin/clients/search?q=${encodeURIComponent(searchTerm)}`)
            if (response.ok) {
                const data = await response.json()
                setSearchResults(data)
            }
        } catch (error) {
            console.error('Error searching clients:', error)
        }
    }

    const handleClientSelect = (client: Client) => {
        setSelectedClient(client)
        setFormData(prev => ({ ...prev, clientId: client.id }))
        setSearchResults([])
        setSearchTerm('')
    }

    const getClientName = (clientId: string) => {
        const client = availableClients.find(c => c.id === clientId)
        return client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Unknown Client' : 'Unknown Client'
    }

    const getClientContact = (clientId: string) => {
        const client = availableClients.find(c => c.id === clientId)
        if (client?.contactInfo && Array.isArray(client.contactInfo)) {
            const primaryContact = client.contactInfo.find((c: any) => c.primary)
            return primaryContact?.value || 'No contact info'
        }
        return 'No contact info'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                    <p className="mt-4 text-lg">Loading programme clients...</p>
                </div>
            </div>
        )
    }

    return (
        <ProtectedRoute requiredRoles={[UserRole.Admin, UserRole.SystemAdmin]}>
            <div className="container mx-auto p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.back()}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">
                            {programmeName ? `Clients for ${programmeName}` : 'Programme Client Management'}
                        </h1>
                        <p className="text-muted-foreground">
                            {programmeName
                                ? `Manage client enrolments for ${programmeName}`
                                : 'Manage client enrolments for programmes'
                            }
                        </p>
                    </div>
                </div>

                {/* Add New Client Enrolment */}
                {isAdding && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Add New Client to Programme</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="search">Search for Client</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        value={searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        placeholder="Search by name or email..."
                                        className="pl-10"
                                    />
                                </div>

                                {/* Search Results */}
                                {searchResults.length > 0 && (
                                    <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                                        {searchResults.map((client) => (
                                            <div
                                                key={client.id}
                                                className={`p-2 cursor-pointer hover:bg-muted transition-colors ${selectedClient?.id === client.id ? 'bg-primary/10 border-primary' : ''
                                                    }`}
                                                onClick={() => handleClientSelect(client)}
                                            >
                                                <div className="font-medium">
                                                    {client.firstName} {client.lastName}
                                                </div>
                                                {client.contactInfo && Array.isArray(client.contactInfo) && (
                                                    <div className="text-sm text-muted-foreground">
                                                        {client.contactInfo.find((c: any) => c.primary)?.value || 'No contact info'}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedClient && (
                                <div className="p-3 bg-muted rounded-md">
                                    <div className="flex items-center gap-2">
                                        <UserPlus className="h-4 w-4" />
                                        <span className="font-medium">Selected Client:</span>
                                        <span>{selectedClient.firstName} {selectedClient.lastName}</span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <Label htmlFor="notes">Enrolment Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Optional notes about this enrolment..."
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={!selectedClient}
                                    className="flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    Add Client to Programme
                                </Button>
                                <Button variant="outline" onClick={handleCancel}>
                                    <X className="h-4 w-4" />
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Programme Enrolments List */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">
                        {programmeName ? `Enrolled Clients for ${programmeName}` : 'All Programme Enrolments'}
                    </h2>
                    {!isAdding && (
                        <Button onClick={handleAddNew} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add Client to Programme
                        </Button>
                    )}
                </div>

                <div className="grid gap-4">
                    {enrolments.map((enrolment) => (
                        <Card key={enrolment.id}>
                            <CardContent className="p-6">
                                {editingId === enrolment.id ? (
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Client</Label>
                                            <div className="p-2 bg-muted rounded-md">
                                                {getClientName(enrolment.clientId)}
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Notes</Label>
                                            <Input
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            />
                                        </div>

                                        <div className="flex gap-2">
                                            <Button onClick={handleSave} className="flex items-center gap-2">
                                                <Save className="h-4 w-4" />
                                                Save
                                            </Button>
                                            <Button variant="outline" onClick={handleCancel}>
                                                <X className="h-4 w-4" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-semibold">
                                                    {getClientName(enrolment.clientId)}
                                                </h3>
                                                <Badge variant="default">
                                                    Enrolled
                                                </Badge>
                                            </div>

                                            <div className="text-sm text-muted-foreground space-y-1">
                                                <p><strong>Contact:</strong> {getClientContact(enrolment.clientId)}</p>
                                                {enrolment.notes && <p><strong>Notes:</strong> {enrolment.notes}</p>}
                                                <p><strong>Enrolled:</strong> {new Date(enrolment.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(enrolment)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(enrolment.id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {enrolments.length === 0 && (
                    <Card>
                        <CardContent className="p-6 text-center">
                            <p className="text-muted-foreground">No clients enrolled in this programme yet.</p>
                            <Button onClick={handleAddNew} className="mt-2">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Client
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </ProtectedRoute>
    )
}

export default function ProgrammeClientsManagementPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                    <p className="mt-4 text-lg">Loading...</p>
                </div>
            </div>
        }>
            <ProgrammeClientsManagementContent />
        </Suspense>
    )
} 