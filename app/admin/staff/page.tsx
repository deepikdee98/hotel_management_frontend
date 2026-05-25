"use client"

import { useEffect, useMemo, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Filter,
  Mail,
  Shield,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  createAdminStaff,
  deleteAdminStaff,
  getAdminStaff,
  getAdminStaffSummary,
  updateAdminStaffStatus,
} from "@/lib/backend-api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AVAILABLE_MODULES } from "@/lib/types"
import type { Staff, ModuleType } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

const usernamePattern = /^[a-zA-Z0-9_]{4,}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const normalizeText = (value: string) => value.trim().toLowerCase()
const normalizePhone = (value: string) => value.replace(/[^\d+]/g, "")

export default function StaffManagementPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [staff, setStaff] = useState<Staff[]>([])
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [summary, setSummary] = useState({
    totalStaff: 0,
    activeStaff: 0,
    totalAdmins: 0,
    activeAdmins: 0,
  })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedModules, setSelectedModules] = useState<ModuleType[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "staff" as "admin" | "staff",
    password: "",
  })
  const isUsernameValid = usernamePattern.test(formData.username.trim())
  const isEmailValid = emailPattern.test(formData.email.trim())
  const phoneDigits = normalizePhone(formData.phone)
  const isIndianPrefix = formData.phone.trim().startsWith("+91")
  const isPhoneValid = isIndianPrefix 
    ? phoneDigits.length === 12 
    : (phoneDigits.length === 10 && !formData.phone.trim().startsWith("+")) || (phoneDigits.length >= 7 && phoneDigits.length <= 15)
  const isDuplicateUsername = Boolean(formData.username.trim()) && staff.some((member) =>
    normalizeText(member.username || "") === normalizeText(formData.username)
  )
  const isDuplicateEmail = Boolean(formData.email.trim()) && staff.some((member) =>
    normalizeText(member.email) === normalizeText(formData.email)
  )
  const isDuplicatePhone = Boolean(formData.phone.trim()) && staff.some((member) =>
    normalizePhone(member.phone || "") === phoneDigits
  )
  const isAddStaffFormValid =
    Boolean(formData.name.trim()) &&
    isUsernameValid &&
    !isDuplicateUsername &&
    isEmailValid &&
    !isDuplicateEmail &&
    isPhoneValid &&
    !isDuplicatePhone &&
    Boolean(formData.password) &&
    selectedModules.length > 0

  useEffect(() => {
    const load = async () => {
      try {
        const [staffData, summaryData] = await Promise.all([
          getAdminStaff(),
          getAdminStaffSummary(),
        ])

        setStaff(staffData)

        setSummary(summaryData)
      } catch {
        setStaff([])
      }
    }

    load()
  }, [])

  const filteredStaff = staff.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.username || "").toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" || s.role === roleFilter
    return matchesSearch && matchesRole
  })

  const assignableModules = AVAILABLE_MODULES.filter((module) =>
    user?.modules?.includes(module.id)
  )

  const handleModuleToggle = (moduleId: ModuleType) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]
    )
  }

  const handleAddStaff = async () => {
    if (isSubmitting) return
    if (!isAddStaffFormValid) {
      toast({
        title: "Validation Error",
        description: "Please fix username, email, phone number and required fields before creating the account.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await createAdminStaff({
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role === "admin" ? "hoteladmin" : "staff",
        modules: selectedModules,
      })

      const refreshed = await getAdminStaff(search, roleFilter)
      setStaff(refreshed)
      const summaryData = await getAdminStaffSummary()
      setSummary(summaryData)

      toast({
        title: "Success",
        description: `${formData.role === "admin" ? "Admin" : "Staff"} account created successfully.`,
      })

      setIsAddDialogOpen(false)
      setFormData({ name: "", username: "", email: "", phone: "", role: "staff", password: "" })
      setSelectedModules([])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create staff account.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return

    try {
      await deleteAdminStaff(id)
      const [refreshed, summaryData] = await Promise.all([
        getAdminStaff(search, roleFilter),
        getAdminStaffSummary(),
      ])
      setStaff(refreshed)
      setSummary(summaryData)
      toast({
        title: "Success",
        description: "Staff member deleted successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete staff member.",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (id: string) => {
    const target = staff.find((s) => s.id === id)
    const nextStatus = target?.status === "active" ? "inactive" : "active"

    try {
      await updateAdminStaffStatus(id, nextStatus === "active")
      const [refreshed, summaryData] = await Promise.all([
        getAdminStaff(search, roleFilter),
        getAdminStaffSummary(),
      ])
      setStaff(refreshed)
      setSummary(summaryData)
      toast({
        title: "Status Updated",
        description: `Staff member is now ${nextStatus}.`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update staff status.",
        variant: "destructive",
      })
    }
  }

  const totalStaffCount = useMemo(() => summary.totalStaff || staff.filter((s) => s.role === "staff").length, [summary.totalStaff, staff])
  const activeStaffCount = useMemo(() => summary.activeStaff || staff.filter((s) => s.role === "staff" && s.status === "active").length, [summary.activeStaff, staff])
  const totalAdminCount = useMemo(() => summary.totalAdmins || staff.filter((s) => s.role === "admin").length, [summary.totalAdmins, staff])
  const activeAdminCount = useMemo(() => summary.activeAdmins || staff.filter((s) => s.role === "admin" && s.status === "active").length, [summary.activeAdmins, staff])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground">Create admin or staff accounts and assign module access</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User Account</DialogTitle>
              <DialogDescription>Add an admin or staff user and assign module permissions</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter username"
                    className={formData.username && (!isUsernameValid || isDuplicateUsername) ? "border-destructive" : ""}
                  />
                  {formData.username && !isUsernameValid ? (
                    <p className="text-xs text-destructive">Username must be at least 4 characters and only contain letters, numbers, or underscores.</p>
                  ) : isDuplicateUsername ? (
                    <p className="text-xs text-destructive">Username already exists.</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Username will be used for login.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@hotel.com"
                    className={formData.email && (!isEmailValid || isDuplicateEmail) ? "border-destructive" : ""}
                  />
                  {formData.email && !isEmailValid && (
                    <p className="text-xs text-destructive">Enter a valid email address.</p>
                  )}
                  {isDuplicateEmail && (
                    <p className="text-xs text-destructive">Email already exists.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^\d+]/g, "") })}
                    placeholder="Enter phone number"
                    className={formData.phone && (!isPhoneValid || isDuplicatePhone) ? "border-destructive" : ""}
                  />
                  {formData.phone && !isPhoneValid && (
                    <p className="text-xs text-destructive">Phone number must contain 7 to 15 digits.</p>
                  )}
                  {isDuplicatePhone && (
                    <p className="text-xs text-destructive">Phone number already exists.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Initial Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "admin" | "staff") => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Assign Module Access</Label>
                <p className="text-sm text-muted-foreground">
                  Select which modules this user can access
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {assignableModules.length === 0 ? (
                    <p className="col-span-2 text-sm text-destructive font-medium p-3 border border-destructive/20 bg-destructive/5 rounded-lg">
                      No modules available to assign. Please ensure your account has module permissions.
                    </p>
                  ) : (
                    assignableModules.map((module) => (
                      <div
                        key={module.id}
                        className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedModules.includes(module.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                          }`}
                        onClick={() => handleModuleToggle(module.id)}
                      >
                        <Checkbox
                          checked={selectedModules.includes(module.id)}
                          onCheckedChange={() => handleModuleToggle(module.id)}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{module.name}</p>
                          <p className="text-xs text-muted-foreground">{module.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddStaff}
                  disabled={!isAddStaffFormValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    formData.role === "admin" ? "Create Admin Account" : "Create Staff Account"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <Shield className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalAdminCount}</p>
                <p className="text-sm text-muted-foreground">Total Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <UserCheck className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeAdminCount}</p>
                <p className="text-sm text-muted-foreground">Active Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalStaffCount}</p>
                <p className="text-sm text-muted-foreground">Total Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <UserCheck className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeStaffCount}</p>
                <p className="text-sm text-muted-foreground">Active Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-input"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>{filteredStaff.length} staff members found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Staff Member</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Modules</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Last Login</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {member.name.split(" ").map(n => n[0]).join("")}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{member.name}</p>
                          {member.username && (
                            <div className="text-sm text-muted-foreground">
                              <span>{member.username}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{member.email}</span>
                          </div>
                          {member.phone && (
                            <p className="text-sm text-muted-foreground">{member.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${member.role === "admin"
                        ? "bg-warning/10 text-warning"
                        : "bg-muted text-muted-foreground"
                        }`}>
                        <Shield className="h-3 w-3" />
                        {member.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {member.modules.slice(0, 2).map((module) => (
                          <span
                            key={module}
                            className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
                          >
                            {module.replace("-", " ")}
                          </span>
                        ))}
                        {member.modules.length > 2 && (
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                            +{member.modules.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-foreground">
                        {member.lastLogin || "Never"}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${member.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                          }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(member.id)}>
                            {member.status === "active" ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteStaff(member.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
