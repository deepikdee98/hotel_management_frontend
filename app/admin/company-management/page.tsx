"use client"

import { useEffect, useState } from "react"
import { apiRequest } from "@/services/api/core"
import { useAuth } from "@/lib/auth-context"
import { Building2, Save, Sparkles, CheckCircle2, ShieldAlert, Upload } from "lucide-react"
import { getHotelLogoReadUrl, uploadChainLogo } from "@/services/api/setup.service"

interface StoredFile {
  url?: string
  key?: string
  fileName?: string
  contentType?: string
  uploadedAt?: string
}

interface CompanyData {
  _id: string
  name: string
  code: string
  gstNumber: string
  email: string
  phone: string
  address: string
  subscriptionPlan: string
  maxAllowedProperties: number
  status: string
  logo?: StoredFile | null
}

export default function CompanyManagementPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState("")
  const [company, setCompany] = useState<CompanyData>({
    _id: "",
    name: "",
    code: "",
    gstNumber: "",
    email: "",
    phone: "",
    address: "",
    subscriptionPlan: "Standard",
    maxAllowedProperties: 1,
    status: "active",
    logo: null,
  })

  useEffect(() => {
    async function loadCompany() {
      try {
        const res = await apiRequest<{ success: boolean; data: CompanyData }>("/front-office/company/settings")
        if (res.success && res.data) {
          setCompany(res.data)
          if (res.data.logo?.key) {
            getHotelLogoReadUrl(res.data.logo.key)
              .then(setLogoPreview)
              .catch(() => setLogoPreview(res.data.logo?.url || ""))
          } else {
            setLogoPreview(res.data.logo?.url || "")
          }
        }
      } catch (err) {
        setErrorMsg("Failed to load company details.")
      } finally {
        setLoading(false)
      }
    }
    loadCompany()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg("")
    setErrorMsg("")

    try {
      const uploadedLogo = logoFile ? await uploadChainLogo(logoFile) : company.logo
      const res = await apiRequest<{ success: boolean; data: CompanyData }>("/front-office/company/settings", {
        method: "PUT",
        body: JSON.stringify({
          ...company,
          logo: uploadedLogo || null,
        }),
      })
      if (res.success) {
        setSuccessMsg("Company settings updated successfully!")
        setLogoFile(null)
        if (res.data) {
          setCompany(res.data)
          if (res.data.logo?.key) {
            const readUrl = await getHotelLogoReadUrl(res.data.logo.key).catch(() => res.data.logo?.url || "")
            setLogoPreview(readUrl)
          } else {
            setLogoPreview(res.data.logo?.url || "")
          }
        }
      } else {
        setErrorMsg("Failed to update settings.")
      }
    } catch (err) {
      setErrorMsg("Failed to update company settings.")
    } finally {
      setSaving(false)
    }
  }

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please choose an image file for company logo.")
      return
    }

    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const isAdmin = user?.role === "company-admin" || user?.role === "super-admin"

  return (
    <div className="container max-w-4xl py-8 space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-extrabold tracking-tight">Company Management</h1>
        </div>
        <p className="text-muted-foreground text-sm max-w-xl">
          Configure corporate-level details, contact coordinates, billing identification, and view current platform tier.
        </p>
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

      <form onSubmit={handleSubmit} className="p-6 bg-card text-card-foreground border border-border rounded-xl shadow-lg space-y-6">
        <h2 className="text-lg font-bold border-b border-border pb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Corporate Profile
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-3">
            <label className="text-sm font-semibold text-muted-foreground" htmlFor="company-logo-upload">Company Logo</label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted flex items-center justify-center">
                {logoPreview ? (
                  <img src={logoPreview} alt="Company logo preview" className="h-full w-full object-contain" />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <input id="company-logo-upload" type="file" accept="image/*" className="hidden" disabled={!isAdmin} onChange={handleLogoChange} />
                <label
                  htmlFor="company-logo-upload"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-input bg-background text-sm font-semibold transition-colors ${
                    isAdmin ? "cursor-pointer hover:bg-muted" : "cursor-not-allowed opacity-60"
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Choose Logo
                </label>
                <p className="text-xs text-muted-foreground">
                  {logoFile?.name || company.logo?.fileName || "Stored separately under the chain logo folder in S3."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground" htmlFor="compName">Company Name</label>
            <input
              id="compName"
              type="text"
              disabled={!isAdmin}
              value={company.name}
              onChange={e => setCompany({ ...company, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground" htmlFor="compCode">Company Code</label>
            <input
              id="compCode"
              type="text"
              disabled
              value={company.code}
              className="w-full px-3 py-2 rounded-lg border border-input bg-muted cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground" htmlFor="compGst">GST Number</label>
            <input
              id="compGst"
              type="text"
              disabled={!isAdmin}
              value={company.gstNumber || ""}
              onChange={e => setCompany({ ...company, gstNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
            />
          </div>

	          <div className="space-y-2">
	            <label className="text-sm font-semibold text-muted-foreground" htmlFor="compPlan">Subscription Plan</label>
	            <input
              id="compPlan"
              type="text"
              disabled
              value={company.subscriptionPlan || "Standard"}
	              className="w-full px-3 py-2 rounded-lg border border-input bg-muted cursor-not-allowed text-primary font-medium"
	            />
	          </div>

	          <div className="space-y-2">
	            <label className="text-sm font-semibold text-muted-foreground" htmlFor="compMaxProperties">Max Properties</label>
	            <input
	              id="compMaxProperties"
	              type="number"
	              disabled
	              value={company.maxAllowedProperties || 1}
	              className="w-full px-3 py-2 rounded-lg border border-input bg-muted cursor-not-allowed text-primary font-medium"
	            />
	          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground" htmlFor="compEmail">Email Contact</label>
            <input
              id="compEmail"
              type="email"
              disabled={!isAdmin}
              value={company.email || ""}
              onChange={e => setCompany({ ...company, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground" htmlFor="compPhone">Phone Contact</label>
            <input
              id="compPhone"
              type="text"
              disabled={!isAdmin}
              value={company.phone || ""}
              onChange={e => setCompany({ ...company, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground" htmlFor="compAddr">Address</label>
          <textarea
            id="compAddr"
            disabled={!isAdmin}
            rows={3}
            value={company.address || ""}
            onChange={e => setCompany({ ...company, address: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-shadow resize-none"
          />
        </div>

        {isAdmin && (
          <div className="flex justify-end pt-4 border-t border-border">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/95 transition-all shadow-md focus:ring-2 focus:ring-primary/50 focus:outline-none disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving Changes..." : "Save Settings"}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
