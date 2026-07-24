'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Bell, Trash2, CheckCircle, AlertCircle, Info } from 'lucide-react'
import {
  getHotelNotifications,
  markNotificationAsRead,
  deleteNotification,
} from '@/lib/backend-api'
import type { Notification } from '@/lib/types'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const resp = await getHotelNotifications(50)
        setNotifications((Array.isArray(resp.data) ? resp.data : []) as unknown as Notification[])
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      )
    } catch (error) {
      console.error('Failed to mark as read:', error)
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

  const handleMarkAllAsRead = async () => {
    for (const notif of notifications.filter((n) => !n.isRead)) {
      try {
        await markNotificationAsRead(notif.id)
      } catch (error) {
        console.error('Failed to mark as read:', error)
      }
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'module-update':
        return <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-300" />
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-300" />
      case 'promotion':
        return <Info className="h-5 w-5 text-green-600 dark:text-green-300" />
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'module-update':
        return 'bg-blue-500/12 text-blue-800 dark:text-blue-200'
      case 'alert':
        return 'bg-red-500/12 text-red-800 dark:text-red-200'
      case 'promotion':
        return 'bg-green-500/12 text-green-800 dark:text-green-200'
      default:
        return 'bg-muted text-foreground'
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Manage your notifications from the system and admin
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read">
            Read ({notifications.filter((n) => n.isRead).length})
          </TabsTrigger>
        </TabsList>

        {/* All Notifications */}
        <TabsContent value="all" className="space-y-3">
          {notifications.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="py-12 text-center text-muted-foreground">
                No notifications
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <Card
                  key={notif.id}
                  className={`${!notif.isRead ? 'border-primary/35 bg-primary/[0.07]' : ''} hover:shadow-md transition-shadow`}
                >
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
                            <p className="text-sm text-muted-foreground mt-1">
                              {notif.message}
                            </p>
                          </div>
                          <Badge className={getTypeColor(notif.type)}>
                            {notif.type.replace(/-/g, ' ')}
                          </Badge>
                        </div>

                        {/* Timestamp & Actions */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground">
                            {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <div className="flex gap-2">
                            {!notif.isRead && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMarkAsRead(notif.id)}
                              >
                                Mark as read
                              </Button>
                            )}
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Unread Only */}
        <TabsContent value="unread" className="space-y-3">
          {notifications.filter((n) => !n.isRead).length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="py-12 text-center text-muted-foreground">
                No unread notifications
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications
                .filter((n) => !n.isRead)
                .map((notif) => (
                  <Card key={notif.id} className="border-primary/35 bg-primary/[0.07]">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <div className="pt-1">{getNotificationIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-sm">{notif.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notif.message}
                              </p>
                            </div>
                            <Badge className={getTypeColor(notif.type)}>
                              {notif.type.replace(/-/g, ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMarkAsRead(notif.id)}
                              >
                                Mark as read
                              </Button>
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* Read Only */}
        <TabsContent value="read" className="space-y-3">
          {notifications.filter((n) => n.isRead).length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="py-12 text-center text-muted-foreground">
                No read notifications
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications
                .filter((n) => n.isRead)
                .map((notif) => (
                  <Card key={notif.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <div className="pt-1">{getNotificationIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-sm">{notif.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notif.message}
                              </p>
                            </div>
                            <Badge className={getTypeColor(notif.type)}>
                              {notif.type.replace(/-/g, ' ')}
                            </Badge>
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
