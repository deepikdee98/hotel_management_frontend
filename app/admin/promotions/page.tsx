'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Plus, Send, Edit2, Trash2, Eye } from 'lucide-react'
import {
  getHotelPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  sendPromotionNotification,
  getStaffGuests,
} from '@/lib/backend-api'
import type { Promotion, Guest } from '@/lib/types'

export default function PromotionsPage() {
  const { user } = useAuth()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [selectedGuests, setSelectedGuests] = useState<string[]>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    audienceType: 'all-guests' as 'all-guests' | 'specific-guests' | 'repeat-guests',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [promotionsResp, guestsResp] = await Promise.all([
          getHotelPromotions(),
          getStaffGuests(),
        ])
        setPromotions(promotionsResp.data)
        setGuests(guestsResp.guests)

      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleCreatePromotion = async () => {
    try {
      await createPromotion({
        ...formData,
        hotelId: user?.hotelId,
        createdBy: user?.id,
        audienceType: formData.audienceType,
        specificGuestIds: formData.audienceType === 'specific-guests' ? selectedGuests : undefined,
        status: 'scheduled',
        notificationSent: false,
      })

      // Refresh promotions
      const resp = await getHotelPromotions()
      setPromotions(resp.data)

      // Reset form
      setShowCreateForm(false)
      setFormData({
        title: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: '',
        audienceType: 'all-guests',
      })
      setSelectedGuests([])
    } catch (error) {
      console.error('Failed to create promotion:', error)
      alert('Failed to create promotion')
    }
  }

  const handleSendPromotion = async (promotionId: string, audienceType: string) => {
    try {
      const promotion = promotions.find((p) => p.id === promotionId)
      const guestIds = audienceType === 'specific-guests' ? promotion?.specificGuestIds : undefined

      await sendPromotionNotification(promotionId, guestIds)

      // Update promotion status
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === promotionId ? { ...p, notificationSent: true } : p
        )
      )
    } catch (error) {
      console.error('Failed to send promotion:', error)
      alert('Failed to send promotion')
    }
  }

  const handleDeletePromotion = async (promotionId: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return

    try {
      await deletePromotion(promotionId)
      setPromotions((prev) => prev.filter((p) => p.id !== promotionId))
    } catch (error) {
      console.error('Failed to delete promotion:', error)
      alert('Failed to delete promotion')
    }
  }

  const formatDiscountDisplay = (type: string, value: number) => {
    if (type === 'percentage') {
      return `${value}% OFF`
    } else {
      return `₹${value} OFF`
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'expired':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
          <h1 className="text-3xl font-bold tracking-tight">Promotions</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage promotions to send to your customers
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Promotion
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Create New Promotion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-sm font-medium">Promotion Title</label>
              <input
                type="text"
                placeholder="e.g., Weekend Special Offer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border rounded mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                placeholder="Describe your promotion..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full p-2 border rounded mt-1"
              />
            </div>

            {/* Discount */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Discount Type</label>
                <select
                  value={formData.discountType}
                  onChange={(e) =>
                    setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })
                  }
                  className="w-full p-2 border rounded mt-1"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Discount Value</label>
                <input
                  type="number"
                  min="0"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded mt-1"
                />
              </div>
              <div className="flex items-end">
                <div className="text-3xl font-bold text-blue-600">
                  {formatDiscountDisplay(formData.discountType, formData.discountValue)}
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Valid From</label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full p-2 border rounded mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Valid Until</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full p-2 border rounded mt-1"
                />
              </div>
            </div>

            {/* Audience */}
            <div>
              <label className="text-sm font-medium mb-2 block">Target Audience</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="audience"
                    value="all-guests"
                    checked={formData.audienceType === 'all-guests'}
                    onChange={(e) =>
                      setFormData({ ...formData, audienceType: e.target.value as any })
                    }
                  />
                  <span>All Guests</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="audience"
                    value="repeat-guests"
                    checked={formData.audienceType === 'repeat-guests'}
                    onChange={(e) =>
                      setFormData({ ...formData, audienceType: e.target.value as any })
                    }
                  />
                  <span>Repeat Guests Only</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="audience"
                    value="specific-guests"
                    checked={formData.audienceType === 'specific-guests'}
                    onChange={(e) =>
                      setFormData({ ...formData, audienceType: e.target.value as any })
                    }
                  />
                  <span>Specific Guests</span>
                </label>
              </div>

              {/* Specific Guests Selection */}
              {formData.audienceType === 'specific-guests' && (
                <div className="mt-3 max-h-48 overflow-y-auto border rounded p-2">
                  {guests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No guests available</p>
                  ) : (
                    guests.map((guest) => (
                      <label key={guest.id} className="flex items-center gap-2 p-2 hover:bg-blue-100">
                        <input
                          type="checkbox"
                          checked={selectedGuests.includes(guest.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGuests([...selectedGuests, guest.id])
                            } else {
                              setSelectedGuests(selectedGuests.filter((id) => id !== guest.id))
                            }
                          }}
                        />
                        <span className="text-sm">{guest.name}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setSelectedGuests([])
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreatePromotion}>Create Promotion</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promotions List */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active ({promotions.filter((p) => p.status === 'active').length})</TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled ({promotions.filter((p) => p.status === 'scheduled').length})
          </TabsTrigger>
          <TabsTrigger value="expired">Expired ({promotions.filter((p) => p.status === 'expired').length})</TabsTrigger>
        </TabsList>

        {['active', 'scheduled', 'expired'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            <div className="grid gap-4">
              {promotions
                .filter((p) => p.status === status)
                .map((promo) => (
                  <Card key={promo.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{promo.title}</CardTitle>
                            <Badge className={getStatusBadgeColor(promo.status)}>
                              {promo.status}
                            </Badge>
                            {promo.notificationSent && (
                              <Badge variant="outline">Notified</Badge>
                            )}
                          </div>
                          <CardDescription>{promo.description}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatDiscountDisplay(promo.discountType, promo.discountValue)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Dates */}
                      <div className="text-sm text-muted-foreground">
                        Valid: {new Date(promo.validFrom).toLocaleDateString()} to{' '}
                        {new Date(promo.validUntil).toLocaleDateString()}
                      </div>

                      {/* Audience */}
                      <div className="text-sm">
                        Audience: <span className="font-medium">{promo.audienceType.replace(/-/g, ' ')}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t">
                        {promo.status === 'scheduled' && !promo.notificationSent && (
                          <Button
                            size="sm"
                            onClick={() => handleSendPromotion(promo.id, promo.audienceType)}
                            className="gap-2"
                          >
                            <Send className="h-4 w-4" />
                            Send Notification
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => setEditingPromotion(promo)}
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-2"
                          onClick={() => handleDeletePromotion(promo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {promotions.filter((p) => p.status === status).length === 0 && (
                <Card className="bg-muted/30">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No {status} promotions
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
