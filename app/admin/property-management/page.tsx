"use client"

import { useEffect, useState } from "react"
import { apiRequest } from "@/services/api/core"
import { useAuth } from "@/lib/auth-context"
import { Building, Plus, Edit3, CheckCircle2, ShieldAlert, X } from "lucide-react"
import { AVAILABLE_MODULES, type ModuleType } from "@/lib/types"

interface HotelProperty {
  _id: string
  name: string
  propertyCode?: string
  address: string
  city: string
  state?: string
  country?: string
  phone?: string
  email?: string
  gstNumber?: string
  currency?: string
  timezone?: string
  modules?: ModuleType[]
  isActive: boolean
}

export default function PropertyManagementPage() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<HotelProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<HotelProperty | null>(null)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [formErrorMsg, setFormErrorMsg] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    propertyCode: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    phone: "",
    email: "",
    gstNumber: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
    modules: ["front-office", "housekeeping", "accounts", "reports"] as ModuleType[],
    adminUsername: "",
    adminPassword: "",
    confirmPassword: "",
    isActive: true,
  })

  const loadProperties = async () => {
    setLoading(true)
    setErrorMsg("")
    try {
      const res = await apiRequest<{ success: boolean; data: HotelProperty[] }>("/front-office/properties/list?includeInactive=true")
      if (res.success && res.data) {
        setProperties(res.data)
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load properties.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProperties()
  }, [])

  const handleOpenAdd = () => {
    setEditingProperty(null)
    setFormErrorMsg("")
    setFormData({
      name: "",
      propertyCode: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      phone: "",
      email: "",
      gstNumber: "",
      currency: "INR",
      timezone: "Asia/Kolkata",
      modules: ["front-office", "housekeeping", "accounts", "reports"],
      adminUsername: "",
      adminPassword: "",
      confirmPassword: "",
      isActive: true,
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (prop: HotelProperty) => {
    setEditingProperty(prop)
    setFormErrorMsg("")
    setFormData({
      name: prop.name,
      propertyCode: prop.propertyCode || "",
      address: prop.address || "",
      city: prop.city || "",
      state: prop.state || "",
      country: prop.country || "India",
      phone: prop.phone || "",
      email: prop.email || "",
      gstNumber: prop.gstNumber || "",
      currency: prop.currency || "INR",
      timezone: prop.timezone || "Asia/Kolkata",
      modules: prop.modules?.length ? prop.modules : ["front-office", "housekeeping", "accounts", "reports"],
      adminUsername: "",
      adminPassword: "",
      confirmPassword: "",
      isActive: prop.isActive,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg("")
    setFormErrorMsg("")

    if (!formData.modules.length) {
      setFormErrorMsg("Select at least one module for this property.")
      setSaving(false)
      return
    }

    const isEditingAdminLogin = Boolean(formData.adminUsername.trim() || formData.adminPassword || formData.confirmPassword)
    if (!editingProperty || isEditingAdminLogin) {
      if (!formData.adminUsername.trim()) {
        setFormErrorMsg("Property admin username is required.")
        setSaving(false)
        return
      }
      if (!formData.adminPassword) {
        setFormErrorMsg("Property admin password is required.")
        setSaving(false)
        return
      }
      if (formData.adminPassword !== formData.confirmPassword) {
        setFormErrorMsg("Property admin passwords do not match.")
        setSaving(false)
        return
      }
    }

    try {
      const payload = {
        ...formData,
        propertyCode: formData.propertyCode.trim().toUpperCase(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        adminUsername: formData.adminUsername.trim(),
      }
      let res;
      if (editingProperty) {
        res = await apiRequest<{ success: boolean }>((`/front-office/properties/${editingProperty._id}`), {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      } else {
        res = await apiRequest<{ success: boolean }>("/front-office/properties", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }

      if (res.success) {
        setSuccessMsg(editingProperty ? "Property updated successfully!" : "Property created successfully!")
        setModalOpen(false)
        loadProperties()
      } else {
        setFormErrorMsg("Action failed. Check property code uniqueness.")
      }
    } catch (err: any) {
      setFormErrorMsg(err.message || "Operation failed. Make sure property code is unique.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const role = String(user?.role || "").toLowerCase()
  const isAdmin = ["companyadmin", "company-admin", "superadmin", "super-admin"].includes(role)

  return (
    <div className="container py-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Building className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-extrabold tracking-tight">Property Management</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            View operational properties/branches under your chain, edit branch profiles, or initialize a new hotel property.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/95 transition-all shadow-md focus:ring-2 focus:ring-primary/50 focus:outline-none"
          >
            <Plus className="h-4 w-4" />
            Add Property
          </button>
        )}
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 text-sm rounded-lg bg-green-500/10 text-green-500 border border-green-500/20">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((prop) => (
          <div key={prop._id} className="p-6 bg-card text-card-foreground border border-border rounded-xl shadow hover:shadow-md transition-shadow relative space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="font-bold text-lg text-foreground">{prop.name}</h3>
                <span className="inline-block text-xs uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded font-mono mt-1">
                  {prop.propertyCode || "N/A"}
                </span>
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleOpenEdit(prop)}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Edit property"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="text-sm space-y-1 text-muted-foreground">
              <p><span className="font-semibold">City:</span> {prop.city}</p>
              {prop.phone && <p><span className="font-semibold">Phone:</span> {prop.phone}</p>}
              {prop.email && <p><span className="font-semibold">Email:</span> {prop.email}</p>}
              <p>
                <span className="font-semibold">Status:</span>{" "}
                <span className={prop.isActive ? "text-green-500 font-semibold" : "text-destructive font-semibold"}>
                  {prop.isActive ? "Active" : "Inactive"}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
              <h2 className="text-xl font-bold text-foreground">
                {editingProperty ? "Edit Property Settings" : "Initialize New Property"}
              </h2>
              <button
                onClick={() => {
                  setFormErrorMsg("")
                  setModalOpen(false)
                }}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
              {formErrorMsg && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formErrorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-muted-foreground" htmlFor="propName">Property Name</label>
                  <input
                    id="propName"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-muted-foreground" htmlFor="propCode">Property Code</label>
                  <input
                    id="propCode"
                    type="text"
                    required
                    value={formData.propertyCode}
                    onChange={(e) => setFormData({ ...formData, propertyCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="e.g. DEL01"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-muted-foreground" htmlFor="propEmail">Email</label>
                  <input
                    id="propEmail"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-muted-foreground" htmlFor="propPhone">Phone</label>
                  <input
                    id="propPhone"
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-muted-foreground" htmlFor="propGst">GSTIN Identification</label>
                  <input
                    id="propGst"
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-muted-foreground" htmlFor="propCity">City</label>
                  <input
                    id="propCity"
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-muted-foreground" htmlFor="propState">State</label>
                  <input
                    id="propState"
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-muted-foreground" htmlFor="propCountry">Country</label>
                  <input
                    id="propCountry"
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-muted-foreground" htmlFor="propCurr">Currency</label>
                  <input
                    id="propCurr"
                    type="text"
                    required
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-muted-foreground" htmlFor="propTz">Timezone</label>
                  <input
                    id="propTz"
                    type="text"
                    required
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-muted-foreground" htmlFor="propAddr">Full Address</label>
                <textarea
                  id="propAddr"
                  rows={2}
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Assign Modules</h3>
                  <p className="text-xs text-muted-foreground">Choose which modules this property can use.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {AVAILABLE_MODULES.map((module) => {
                    const checked = formData.modules.includes(module.id)
                    return (
                      <button
                        key={module.id}
                        type="button"
                        onClick={() => {
                          setFormData((current) => ({
                            ...current,
                            modules: checked
                              ? current.modules.filter((item: ModuleType) => item !== module.id)
                              : [...current.modules, module.id],
                          }))
                        }}
                        className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                          checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          readOnly
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-foreground">{module.name}</span>
                          <span className="block text-xs text-muted-foreground">{module.description}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Property Admin Login</h3>
                  <p className="text-xs text-muted-foreground">
                    {editingProperty
                      ? "Optional: enter these fields to create or reset this property's admin login."
                      : "This user can log in directly to manage this property."}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-muted-foreground" htmlFor="propAdminUsername">Admin Username</label>
                    <input
                      id="propAdminUsername"
                      type="text"
                      required={!editingProperty}
                      value={formData.adminUsername}
                      onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                      placeholder="e.g. vijayawada_admin"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-muted-foreground" htmlFor="propAdminPassword">Admin Password</label>
                    <input
                      id="propAdminPassword"
                      type="password"
                      required={!editingProperty}
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-semibold text-muted-foreground" htmlFor="propAdminConfirmPassword">Confirm Admin Password</label>
                    <input
                      id="propAdminConfirmPassword"
                      type="password"
                      required={!editingProperty}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="propActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="propActive" className="text-sm font-semibold text-muted-foreground select-none">
                  Is Active Branch
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setFormErrorMsg("")
                    setModalOpen(false)
                  }}
                  className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/95 transition-all shadow disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
