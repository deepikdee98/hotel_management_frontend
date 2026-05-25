'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Bell, Send, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import {
  getSuperAdminNotifications,
  sendAdminNotification,
  deleteNotification,
} from '@/lib/backend-api'
import type { Notification, NotificationRecipient, NotificationType } from '@/lib/types'

export default function SuperAdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [sendingNotif, setSendingNotif] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'system-update' as NotificationType,
    hotelId: '', // If empty, sends to all hotels
  })

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const resp = await getSuperAdminNotifications()
        setNotifications((Array.isArray(resp.data) ? resp.data : []) as unknown as Notification[])
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const handleSendNotification = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      alert('Please fill in all fields')
      return
    }

    setSendingNotif(true)
    try {
      const payload = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        recipient: (formData.hotelId ? 'hotel' : 'all') as NotificationRecipient,
        hotelId: formData.hotelId || undefined,
        senderId: 'super-admin-1', // Would come from auth context
        senderType: 'admin' as const,
      }

      await sendAdminNotification(payload)

      // Add to notifications list
      const newNotif: Notification = {
        id: Date.now().toString(),
        ...payload,
        isRead: false,
        createdAt: new Date().toISOString(),
        recipientName: formData.hotelId ? 'Selected Hotel' : 'All Hotels',
      }

      setNotifications((prev) => [newNotif, ...prev])
      setFormData({
        title: '',
        message: '',
        type: 'system-update',
        hotelId: '',
      })
      setShowSendDialog(false)
    } catch (error) {
      console.error('Failed to send notification:', error)
      alert('Failed to send notification')
    } finally {
      setSendingNotif(false)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system-update':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'system-update':
        return 'bg-blue-100 text-blue-800'
      case 'alert':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredNotifications = notifications.filter(
    (n) =>
      n.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      n.message.toLowerCase().includes(searchFilter.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Send important messages to all hotels or specific hotel admins
          </p>
        </div>
        <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <DialogTrigger asChild>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Send Notification
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Notification to Hotels</DialogTitle>
              <DialogDescription>
                Broadcast a message to all hotels or send to a specific hotel
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Type */}
              <div>
                <label className="text-sm font-medium mb-2 block">Notification Type</label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={formData.type === 'system-update' ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, type: 'system-update' })}
                  >
                    System Update
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === 'alert' ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, type: 'alert' })}
                  >
                    Alert
                  </Button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="text-sm font-medium mb-2 block">
                  Title
                </label>
                <Input
                  id="title"
                  placeholder="Notification title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="text-sm font-medium mb-2 block">
                  Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Detailed message..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Hotel ID (optional) */}
              <div>
                <label htmlFor="hotelId" className="text-sm font-medium mb-2 block">
                  Hotel ID (leave empty for all hotels)
                </label>
                <Input
                  id="hotelId"
                  placeholder="hotel-id or leave blank for broadcast"
                  value={formData.hotelId}
                  onChange={(e) => setFormData({ ...formData, hotelId: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.hotelId ? `Sending to specific hotel: ${formData.hotelId}` : 'Sending to all hotels'}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSendDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendNotification} disabled={sendingNotif}>
                {sendingNotif ? 'Sending...' : 'Send'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Input
        placeholder="Search notifications..."
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.target.value)}
        className="max-w-md"
      />

      {/* Notifications List */}
      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({notifications.filter((n) => !n.isRead).length})
          </TabsTrigger>
        </TabsList>

        {/* Recent */}
        <TabsContent value="recent" className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="py-12 text-center text-muted-foreground">
                {searchFilter ? 'No notifications match your search' : 'No notifications'}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notif) => (
                <Card key={notif.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="pt-1">{getNotificationIcon(notif.type)}</div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-sm">
                              {notif.title}
                              {!notif.isRead && (
                                <span className="ml-2 inline-block h-2 w-2 bg-blue-600 rounded-full" />
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notif.message}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getTypeColor(notif.type)}>
                              {notif.type.replace(/-/g, ' ')}
                            </Badge>
                            {notif.recipient === 'all' && (
                              <Badge variant="secondary">Broadcast</Badge>
                            )}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>
                              To:{' '}
                              <span className="font-medium">
                                {notif.recipient === 'all' ? 'All Hotels' : notif.recipientName}
                              </span>
                            </p>
                            <p>
                              {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                              {new Date(notif.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(notif.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Unread */}
        <TabsContent value="unread" className="space-y-3">
          {notifications.filter((n) => !n.isRead).length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="py-12 text-center text-muted-foreground">
                All notifications read
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications
                .filter((n) => !n.isRead)
                .map((notif) => (
                  <Card key={notif.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <div className="pt-1">{getNotificationIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-sm">{notif.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notif.message}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getTypeColor(notif.type)}>
                                {notif.type.replace(/-/g, ' ')}
                              </Badge>
                              {notif.recipient === 'all' && (
                                <Badge variant="secondary">Broadcast</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(notif.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
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
