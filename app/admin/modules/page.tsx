'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, CheckCircle, Clock, Send } from 'lucide-react'
import {
  getHotelModuleRequests,
  createModuleRequest,
  getAvailableModules,
  getHotelModules,
} from '@/lib/backend-api'
import type { ModuleRequest, ModuleType } from '@/lib/types'

export default function ModuleRequestPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<ModuleRequest[]>([])
  const [availableModules, setAvailableModules] = useState<any[]>([])
  const [currentModules, setCurrentModules] = useState<ModuleType[]>([])
  const [selectedModules, setSelectedModules] = useState<ModuleType[]>([])
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const hotelId = user?.hotelId || ''

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modulesResp, currentResp, requestsResp] = await Promise.all([
          getAvailableModules(),
          getHotelModules(hotelId),
          getHotelModuleRequests(hotelId),
        ])
        setAvailableModules(modulesResp.data)
        setCurrentModules(currentResp.data?.modules || [])
        setRequests(requestsResp.data)
      } finally {
        setLoading(false)
      }
    }

    if (hotelId) {
      fetchData()
    }
  }, [hotelId])

  const handleToggleModule = useCallback((moduleId: string) => {
    setSelectedModules((prev) => {
      const alreadySelected = prev.includes(moduleId as ModuleType)
      const alreadyActive = currentModules.includes(moduleId as ModuleType)

      if (alreadyActive) {
        return prev // Can't unselect already active modules
      }

      if (alreadySelected) {
        return prev.filter((m) => m !== moduleId)
      } else {
        return [...prev, moduleId as ModuleType]
      }
    })
  }, [currentModules])

  const handleSubmitRequest = async () => {
    if (selectedModules.length === 0) {
      alert('Please select at least one module')
      return
    }

    setSubmitting(true)
    try {
      await createModuleRequest({
        hotelId,
        requestedModules: selectedModules,
        reason,
      })

      setSuccessMessage('Module request submitted successfully!')
      setSelectedModules([])
      setReason('')

      // Refresh requests list
      const updatedRequests = await getHotelModuleRequests(hotelId)
      setRequests(updatedRequests.data)

      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (error) {
      console.error('Failed to submit request:', error)
      alert('Failed to submit module request')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status: ModuleRequest['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
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
    }
  }

  const pendingRequest = requests.find((r) => r.status === 'pending')

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Request Modules</h1>
        <p className="text-muted-foreground mt-2">
          Request additional modules for your hotel to expand functionality
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-4 text-green-900">
            {successMessage}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="request" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="request">Request New Module</TabsTrigger>
          <TabsTrigger value="history">Request History</TabsTrigger>
        </TabsList>

        {/* Request Tab */}
        <TabsContent value="request" className="space-y-4">
          {/* Current Modules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Current Modules</CardTitle>
              <CardDescription>Modules already enabled for your hotel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {currentModules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No modules enabled</p>
                ) : (
                  currentModules.map((module) => (
                    <Badge key={module} variant="default">
                      {module}
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Available Modules to Request */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Modules</CardTitle>
              <CardDescription>
                {pendingRequest
                  ? 'You have a pending request. Wait for admin approval before requesting more modules.'
                  : 'Select modules you would like to request'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableModules
                .filter((mod) => !currentModules.includes(mod.id))
                .map((module) => (
                  <div key={module.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                    <Checkbox
                      id={`module-${module.id}`}
                      checked={selectedModules.includes(module.id)}
                      onCheckedChange={() => handleToggleModule(module.id)}
                      disabled={!!pendingRequest}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`module-${module.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {module.name}
                      </label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {module.description}
                      </p>
                    </div>
                  </div>
                ))}

              {availableModules.filter((mod) => !currentModules.includes(mod.id)).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All available modules are already enabled for your hotel
                </p>
              )}
            </CardContent>
          </Card>

          {/* Reason */}
          {!pendingRequest && selectedModules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reason for Request</CardTitle>
                <CardDescription>Help us understand why you need these modules (optional)</CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  placeholder="Explain your business need for these modules..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 border rounded-lg text-sm"
                  rows={4}
                />
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          {!pendingRequest && (
            <div className="flex justify-end gap-2">
              {selectedModules.length > 0 && (
                <Button
                  onClick={() => {
                    setSelectedModules([])
                    setReason('')
                  }}
                  variant="outline"
                >
                  Clear Selection
                </Button>
              )}
              <Button
                onClick={handleSubmitRequest}
                disabled={selectedModules.length === 0 || submitting || !!pendingRequest}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          )}

          {pendingRequest && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="py-4">
                <p className="text-sm text-yellow-900">
                  <strong>Note:</strong> You have a pending module request. Please wait for admin approval
                  before submitting another request.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {requests.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="py-12 text-center text-muted-foreground">
                No module requests yet
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">
                            {request.requestedModules.join(', ')}
                          </CardTitle>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1 capitalize">{request.status}</span>
                          </Badge>
                        </div>
                        <CardDescription>
                          Requested on {new Date(request.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {request.reason && (
                      <div>
                        <p className="text-sm font-medium mb-1">Your Reason:</p>
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                      </div>
                    )}

                    {request.adminNotes && (
                      <div>
                        <p className="text-sm font-medium mb-1">Admin Notes:</p>
                        <p className="text-sm text-muted-foreground">{request.adminNotes}</p>
                      </div>
                    )}

                    {request.respondedAt && (
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        {request.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                        {new Date(request.respondedAt).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
