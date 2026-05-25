'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Check, X, Clock, Plus } from 'lucide-react'
import {
  getAvailableModules,
  getModuleRequests,
  approveModuleRequest,
  rejectModuleRequest,
  sendAdminNotification,
} from '@/lib/backend-api'
import type { ModuleRequest } from '@/lib/types'

export default function ModulesPage() {
  const [moduleRequests, setModuleRequests] = useState<ModuleRequest[]>([])
  const [availableModules, setAvailableModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [selectedRequest, setSelectedRequest] = useState<ModuleRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [requests, modules] = await Promise.all([
          getModuleRequests(),
          getAvailableModules(),
        ])
        setModuleRequests((Array.isArray(requests.data) ? requests.data : []) as unknown as ModuleRequest[])
        setAvailableModules(Array.isArray(modules.data) ? modules.data : [])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleApprove = async (request: ModuleRequest) => {
    try {
      await approveModuleRequest(request.id, request.hotelId, request.requestedModules)

      // Notify hotel admin
      await sendAdminNotification({
        type: 'module-update',
        title: 'Modules Approved',
        message: `Your requested modules have been approved: ${request.requestedModules.join(', ')}`,
        recipient: 'hotel',
        hotelId: request.hotelId,
        senderType: 'admin',
      })

      setModuleRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status: 'approved' } : r)))
      setSelectedRequest(null)
    } catch (error) {
      console.error('Failed to approve request:', error)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return
    try {
      await rejectModuleRequest(selectedRequest.id, rejectReason)

      // Notify hotel admin
      await sendAdminNotification({
        type: 'module-update',
        title: 'Module Request Rejected',
        message: `Your module request has been rejected. Reason: ${rejectReason}`,
        recipient: 'hotel',
        hotelId: selectedRequest.hotelId,
        senderType: 'admin',
      })

      setModuleRequests((prev) => prev.map((r) => (r.id === selectedRequest.id ? { ...r, status: 'rejected' } : r)))
      setSelectedRequest(null)
      setRejectReason('')
    } catch (error) {
      console.error('Failed to reject request:', error)
    }
  }

  const filteredRequests = moduleRequests.filter(
    (r) => statusFilter === 'all' || r.status === statusFilter
  )

  const getStatusIcon = (status: ModuleRequest['status']) => {
    switch (status) {
      case 'approved':
        return <Check className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <X className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: ModuleRequest['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Module Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage hotel module requests and assign modules to hotels
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Module
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests">Module Requests</TabsTrigger>
          <TabsTrigger value="available">Available Modules</TabsTrigger>
        </TabsList>

        {/* Module Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              size="sm"
            >
              All ({moduleRequests.length})
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('pending')}
              size="sm"
            >
              Pending ({moduleRequests.filter((r) => r.status === 'pending').length})
            </Button>
            <Button
              variant={statusFilter === 'approved' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('approved')}
              size="sm"
            >
              Approved ({moduleRequests.filter((r) => r.status === 'approved').length})
            </Button>
            <Button
              variant={statusFilter === 'rejected' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('rejected')}
              size="sm"
            >
              Rejected ({moduleRequests.filter((r) => r.status === 'rejected').length})
            </Button>
          </div>

          {/* Requests List */}
          <div className="grid gap-4">
            {filteredRequests.length === 0 ? (
              <Card className="bg-muted/30">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No module requests found
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{request.hotelName}</CardTitle>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1 capitalize">{request.status}</span>
                          </Badge>
                        </div>
                        <CardDescription>
                          Requested on {new Date(request.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(request)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setSelectedRequest(request)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Requested Modules */}
                    <div>
                      <p className="text-sm font-medium mb-2">Requested Modules:</p>
                      <div className="flex flex-wrap gap-2">
                        {request.requestedModules.map((module) => (
                          <Badge key={module} variant="outline">
                            {module}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Reason */}
                    {request.reason && (
                      <div>
                        <p className="text-sm font-medium mb-1">Reason:</p>
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                      </div>
                    )}

                    {/* Admin Notes */}
                    {request.adminNotes && (
                      <div>
                        <p className="text-sm font-medium mb-1">Admin Notes:</p>
                        <p className="text-sm text-muted-foreground">{request.adminNotes}</p>
                      </div>
                    )}

                    {/* Response Details */}
                    {request.respondedAt && (
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        {request.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                        {new Date(request.respondedAt).toLocaleDateString()} by {request.respondedBy}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Reject Dialog (simplified - in production use Dialog component) */}
          {selectedRequest && selectedRequest.status === 'pending' && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900">Reject Module Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-red-800">
                  Are you sure you want to reject the request from <strong>{selectedRequest.hotelName}</strong>?
                </p>
                <textarea
                  placeholder="Enter reason for rejection (optional)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(null)
                      setRejectReason('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleReject}
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Available Modules Tab */}
        <TabsContent value="available" className="space-y-4">
          <div className="grid gap-4">
            {availableModules.length === 0 ? (
              <Card className="bg-muted/30">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No modules available
                </CardContent>
              </Card>
            ) : (
              availableModules.map((module) => (
                <Card key={module.id}>
                  <CardHeader>
                    <CardTitle>{module.name}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
