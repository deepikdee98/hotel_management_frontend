"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { updateSuperAdminPassword,getSuperAdminProfile,updateSuperAdminProfile} from "@/lib/backend-api"
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Mail,
  Save,
  Key,
} from "lucide-react"

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
 const [profileForm, setProfileForm] = useState({
  username: "",
  email: "",
  phone: "",
  timezone: "",
})

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    newHotelRegistration: true,
    systemUpdates: true,
    securityAlerts: true,
    weeklyReports: false,
    marketingEmails: false,
  })

  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: "30",
    ipWhitelist: "",
  })

  useEffect(() => {
  const fetchProfile = async () => {
    try {
      const data = await getSuperAdminProfile()
      setProfileForm({
        username: data.username || "",
        email: data.email || "",
        phone: data.phone || "",
        timezone: data.timezone || "",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      })
    }
  }

  fetchProfile()
}, [])

  const handleProfileSave = async () => {
  try {
    await updateSuperAdminProfile(profileForm)

    toast({
      title: "Success",
      description: "Profile updated successfully",
    })
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Failed to update profile",
      variant: "destructive",
    })
  }
}

  const handleNotificationsSave = () => {
    alert("Notification settings saved!")
  }

  const handleSecuritySave = () => {
    alert("Security settings saved!")
  }

  const handlePasswordUpdate = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingPassword(true)
    try {
      await updateSuperAdminPassword(passwordForm)
      toast({
        title: "Success",
        description: "Password updated. Please login again."
      })
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setTimeout(() => {
        logout();
        window.location.href = "/";
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <DashboardLayout requiredRole="super-admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Profile Information</CardTitle>
                <CardDescription>Update your personal information and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-semibold text-primary">
                      {user?.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      Change Avatar
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Username</Label>
                    <Input
                      id="name"
                      value={profileForm.username}
onChange={(e) =>
  setProfileForm({ ...profileForm, username: e.target.value })
}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={profileForm.timezone}
                      onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                      className="bg-input border-border"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleProfileSave} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified about activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications for important updates
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailAlerts}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, emailAlerts: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Hotel Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when a new hotel is registered
                      </p>
                    </div>
                    <Switch
                      checked={notifications.newHotelRegistration}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, newHotelRegistration: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>System Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about system maintenance and updates
                      </p>
                    </div>
                    <Switch
                      checked={notifications.systemUpdates}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, systemUpdates: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about security-related events
                      </p>
                    </div>
                    <Switch
                      checked={notifications.securityAlerts}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, securityAlerts: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly summary reports via email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReports}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, weeklyReports: checked })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleNotificationsSave} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Password</CardTitle>
                  <CardDescription>Change your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        className="bg-input border-border"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                        }
                      />
                    </div>
                    <div />
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        className="bg-input border-border"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        className="bg-input border-border"
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" className="gap-2 bg-transparent" onClick={handlePasswordUpdate}
                      disabled={isUpdatingPassword}>
                      <Key className="h-4 w-4" />
                      Update Password
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">Security Settings</CardTitle>
                  <CardDescription>Configure additional security options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch
                      checked={security.twoFactor}
                      onCheckedChange={(checked) =>
                        setSecurity({ ...security, twoFactor: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={security.sessionTimeout}
                      onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                      className="bg-input border-border max-w-xs"
                    />
                    <p className="text-sm text-muted-foreground">
                      Automatically log out after this period of inactivity
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSecuritySave} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save Security Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Appearance</CardTitle>
                <CardDescription>Customize how the application looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-4 max-w-md">
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        mounted && theme === "dark" 
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-[#0a0a0f] border border-border" />
                      <span className="text-sm font-medium text-foreground">Dark</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        mounted && theme === "light" 
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-white border border-border" />
                      <span className="text-sm font-medium text-foreground">Light</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("system")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        mounted && theme === "system" 
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-white to-[#0a0a0f] border border-border" />
                      <span className="text-sm font-medium text-foreground">System</span>
                    </button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Language</Label>
                  <div className="flex items-center gap-3 max-w-xs">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <select className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground">
                      <option value="en">English (US)</option>
                      <option value="en-gb">English (UK)</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Date Format</Label>
                  <div className="flex items-center gap-3 max-w-xs">
                    <select className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground">
                      <option value="mdy">MM/DD/YYYY</option>
                      <option value="dmy">DD/MM/YYYY</option>
                      <option value="ymd">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => {
                      toast({
                        title: "Success",
                        description: "Appearance preferences saved"
                      })
                    }} 
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
