"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Settings, Search, Crown, Shield } from "lucide-react"

type User = {
  id: number
  email: string
  is_admin: boolean
  created_at: string
}

type Permission = {
  key: string
  label: string
  description: string
  category: string
}

type UserPermission = {
  user_id: number
  permission_key: string
  permission_value: boolean
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  // Admin Panel Access
  {
    key: "admin_panel_access",
    label: "Admin Panel Access",
    description: "Can access the admin panel",
    category: "Access",
  },
  {
    key: "view_analytics",
    label: "View Analytics",
    description: "Can view store analytics and statistics",
    category: "Access",
  },

  // Product Management
  {
    key: "manage_products",
    label: "Manage Products",
    description: "Can add, edit, and delete products",
    category: "Products",
  },
  {
    key: "manage_categories",
    label: "Manage Categories",
    description: "Can add, edit, and delete categories",
    category: "Products",
  },
  { key: "manage_inventory", label: "Manage Inventory", description: "Can update stock levels", category: "Products" },
  {
    key: "manage_sales",
    label: "Manage Sales",
    description: "Can create and manage sales/discounts",
    category: "Products",
  },

  // Order Management
  { key: "view_orders", label: "View Orders", description: "Can view purchase requests", category: "Orders" },
  { key: "process_orders", label: "Process Orders", description: "Can complete or cancel orders", category: "Orders" },
  {
    key: "generate_payment_links",
    label: "Generate Payment Links",
    description: "Can generate PayPal payment links",
    category: "Orders",
  },

  // User Management
  { key: "view_users", label: "View Users", description: "Can view user accounts", category: "Users" },
  { key: "manage_users", label: "Manage Users", description: "Can edit user accounts", category: "Users" },
  {
    key: "manage_permissions",
    label: "Manage Permissions",
    description: "Can edit user permissions",
    category: "Users",
  },

  // Financial
  {
    key: "view_financials",
    label: "View Financials",
    description: "Can view financial reports",
    category: "Financial",
  },
  {
    key: "manage_transfers",
    label: "Manage Transfers",
    description: "Can transfer money to other users",
    category: "Financial",
  },
  {
    key: "manage_discount_codes",
    label: "Manage Discount Codes",
    description: "Can create and manage discount codes",
    category: "Financial",
  },

  // System
  { key: "manage_settings", label: "Manage Settings", description: "Can modify system settings", category: "System" },
  {
    key: "maintenance_mode",
    label: "Maintenance Mode",
    description: "Can enable/disable maintenance mode",
    category: "System",
  },
  {
    key: "manage_integrations",
    label: "Manage Integrations",
    description: "Can configure Discord, PayPal, email settings",
    category: "System",
  },
  {
    key: "create_community_posts",
    label: "Create Community Posts",
    description: "Can create posts in the community section",
    category: "Community",
  },
]

interface UserPermissionsManagerProps {
  users: User[]
  onRefresh: () => void
}

export function UserPermissionsManager({ users, onRefresh }: UserPermissionsManagerProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const filteredUsers = users.filter((user) => user.email.toLowerCase().includes(searchTerm.toLowerCase()))

  const fetchUserPermissions = async (userId: number) => {
    try {
      const { data, error } = await supabase.from("user_permissions").select("*").eq("user_id", userId)

      if (error) throw error
      setUserPermissions(data || [])
    } catch (error) {
      console.error("Error fetching user permissions:", error)
      toast.error("Failed to load user permissions")
    }
  }

  const updatePermission = async (userId: number, permissionKey: string, value: boolean) => {
    try {
      setLoading(true)

      const { error } = await supabase.from("user_permissions").upsert(
        {
          user_id: userId,
          permission_key: permissionKey,
          permission_value: value,
        },
        {
          onConflict: "user_id,permission_key",
        },
      )

      if (error) throw error

      // Update local state
      setUserPermissions((prev) => {
        const existing = prev.find((p) => p.permission_key === permissionKey)
        if (existing) {
          return prev.map((p) => (p.permission_key === permissionKey ? { ...p, permission_value: value } : p))
        } else {
          return [...prev, { user_id: userId, permission_key: permissionKey, permission_value: value }]
        }
      })

      toast.success("Permission updated successfully!")
    } catch (error) {
      console.error("Error updating permission:", error)
      toast.error("Failed to update permission")
    } finally {
      setLoading(false)
    }
  }

  const hasPermission = (permissionKey: string): boolean => {
    return userPermissions.some((p) => p.permission_key === permissionKey && p.permission_value)
  }

  const getPermissionsByCategory = () => {
    const categories: Record<string, Permission[]> = {}
    AVAILABLE_PERMISSIONS.forEach((permission) => {
      if (!categories[permission.category]) {
        categories[permission.category] = []
      }
      categories[permission.category].push(permission)
    })
    return categories
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    fetchUserPermissions(user.id)
    setIsDialogOpen(true)
  }

  return (
    <Card className="bg-slate-800/50 border-green-500/20">
      <CardHeader>
        <CardTitle className="text-green-400 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Advanced User Permissions
        </CardTitle>
        <CardDescription>Manage detailed permissions for each user</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-700 border-slate-600"
          />
        </div>

        {/* Users List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <div>
                <p className="font-semibold text-white">{user.email}</p>
                <p className="text-sm text-gray-400">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                {user.is_admin && (
                  <Badge className="bg-yellow-500/20 text-yellow-400">
                    <Crown className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                )}
                <Button size="sm" variant="outline" onClick={() => handleUserSelect(user)}>
                  <Settings className="w-3 h-3 mr-1" />
                  Permissions
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Permissions Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900 border-green-500/30 overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-green-400">Manage Permissions for {selectedUser?.email}</DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 py-4">
                {Object.entries(getPermissionsByCategory()).map(([category, permissions]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="text-lg font-semibold text-blue-400 border-b border-slate-700 pb-2">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {permissions.map((permission) => (
                        <div
                          key={permission.key}
                          className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                        >
                          <div className="flex-1">
                            <Label htmlFor={permission.key} className="font-medium text-white cursor-pointer">
                              {permission.label}
                            </Label>
                            <p className="text-sm text-gray-400 mt-1">{permission.description}</p>
                          </div>
                          <Switch
                            id={permission.key}
                            checked={hasPermission(permission.key)}
                            onCheckedChange={(checked) =>
                              selectedUser && updatePermission(selectedUser.id, permission.key, checked)
                            }
                            disabled={loading}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
