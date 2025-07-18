"use client"

import { useState, useEffect } from "react"
import { supabase, type Category, type Subcategory, type Product } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { getPurchaseRequests, completePurchase, cancelPurchase, type PurchaseRequest } from "@/lib/purchases"
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from "@/lib/notifications"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus,
  Trash2,
  ArrowLeft,
  Edit,
  Users,
  Bell,
  Package,
  Settings,
  CheckCircle,
  XCircle,
  Search,
  Crown,
  AlertTriangle,
  Percent,
  BookOpen,
  ExternalLink,
  LinkIcon,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

// Add imports at the top
import { ImageUploader } from "@/components/admin/image-uploader"
import { RarityColorsManager } from "@/components/admin/rarity-colors-manager"
// Add the PaymentMethodsManager import at the top with other imports
import { PaymentMethodsManager } from "@/components/admin/payment-methods-manager"
import { PurchaseSearch } from "@/components/admin/purchase-search"
import { ProductActionsEditor } from "@/components/admin/product-actions-editor"
import { DiscountCodesManager } from "@/components/admin/discount-codes-manager"
import { UserPermissionsManager } from "@/components/admin/user-permissions-manager"

type User = {
  id: number
  email: string
  is_admin: boolean
  created_at: string
}

type AdminSettings = {
  [key: string]: string
}

export default function AdminPage() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [saleProduct, setSaleProduct] = useState<Product | null>(null)
  const [salePercentage, setSalePercentage] = useState("")
  const [filteredPurchaseRequests, setFilteredPurchaseRequests] = useState<PurchaseRequest[]>([])
  const [purchaseSearchTerm, setPurchaseSearchTerm] = useState("")
  const [purchaseFilter, setPurchaseFilter] = useState("all")
  const [userPermissions, setUserPermissions] = useState<string[]>([])

  // Form states
  const [newCategory, setNewCategory] = useState({ name: "", slug: "" })
  const [newSubcategory, setNewSubcategory] = useState({ name: "", slug: "", category_id: "" })
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    subcategory_id: "",
    specifications: "{}",
    stock: "",
    unique_id: "",
  })

  useEffect(() => {
    if (user) {
      fetchUserPermissions()
      if (hasPermission("admin_panel_access")) {
        fetchAllData()
      }
    }
  }, [user])

  useEffect(() => {
    setFilteredPurchaseRequests(purchaseRequests)
  }, [purchaseRequests])

  const fetchUserPermissions = async () => {
    if (!user) return

    try {
      const { data } = await supabase
        .from("user_permissions")
        .select("permission_key")
        .eq("user_id", user.id)
        .eq("permission_value", true)

      if (data) {
        setUserPermissions(data.map((p) => p.permission_key))
      }
    } catch (error) {
      console.error("Error fetching user permissions:", error)
    }
  }

  const hasPermission = (permission: string) => {
    return user?.is_admin || userPermissions.includes(permission)
  }

  const fetchAllData = async () => {
    await Promise.all([
      fetchCategories(),
      fetchSubcategories(),
      fetchProducts(),
      fetchUsers(),
      fetchPurchaseRequests(),
      fetchNotifications(),
      fetchAdminSettings(),
    ])
  }

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name")
    if (data) setCategories(data)
  }

  const fetchSubcategories = async () => {
    const { data } = await supabase.from("subcategories").select("*").order("name")
    if (data) setSubcategories(data)
  }

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false })
    if (data) setProducts(data)
  }

  const fetchUsers = async () => {
    const { data } = await supabase.from("users").select("*").order("created_at", { ascending: false })
    if (data) setUsers(data)
  }

  const fetchPurchaseRequests = async () => {
    try {
      const requests = await getPurchaseRequests()
      setPurchaseRequests(requests)
    } catch (error) {
      console.error("Error fetching purchase requests:", error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const notifs = await getNotifications()
      setNotifications(notifs)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  const fetchAdminSettings = async () => {
    const { data } = await supabase.from("admin_settings").select("*")
    if (data) {
      const settings: AdminSettings = {}
      data.forEach((setting) => {
        settings[setting.setting_key] = setting.setting_value
      })
      setAdminSettings(settings)
    }
  }

  const generatePaymentLink = async (purchaseRequest: PurchaseRequest) => {
    if (!hasPermission("generate_payment_links")) {
      toast.error("You don't have permission to generate payment links")
      return
    }

    // Build a simple PayPal.me link (replace with your real integration)
    const paypalLink = `https://www.paypal.com/paypalme/tobeaddedusername/${purchaseRequest.total_price.toFixed(2)}EUR`

    // 1. Attempt to persist the link in Supabase
    try {
      const { error } = await supabase.from("payment_links").insert([
        {
          purchase_request_id: purchaseRequest.id,
          paypal_link: paypalLink,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 h
        },
      ])

      if (error) {
        // Log the Supabase error but continue
        console.warn("Could not save payment link in database:", error)
      }
    } catch (err) {
      // Table might not exist in preview DB – just warn and continue
      console.warn("Unexpected error saving payment link:", err)
    }

    // 2. Copy the link (this can still fail on http/localhost)
    try {
      await navigator.clipboard.writeText(
        `Payment Link for ${purchaseRequest.purchase_id}:\n${paypalLink}\n\n` +
          `Please send €${purchaseRequest.total_price.toFixed(2)} via PayPal ` +
          `and include your Purchase ID: ${purchaseRequest.purchase_id}`,
      )
      toast.success("Payment link generated and copied to clipboard!")
    } catch (err) {
      console.warn("Clipboard write failed:", err)
      toast.success("Payment link generated! (Copy failed – copy it manually.)")
    }
  }

  const handlePurchaseSearch = (term: string, filter: string) => {
    setPurchaseSearchTerm(term)
    setPurchaseFilter(filter)

    let filtered = purchaseRequests

    if (term) {
      filtered = filtered.filter((request) => {
        const searchLower = term.toLowerCase()
        if (filter === "email") {
          return request.user.email.toLowerCase().includes(searchLower)
        } else if (filter === "purchase_id") {
          return request.purchase_id.toLowerCase().includes(searchLower)
        } else {
          return (
            request.user.email.toLowerCase().includes(searchLower) ||
            request.purchase_id.toLowerCase().includes(searchLower)
          )
        }
      })
    }

    if (filter === "pending" || filter === "completed" || filter === "cancelled") {
      filtered = filtered.filter((request) => request.status === filter)
    }

    setFilteredPurchaseRequests(filtered)
  }

  const handlePurchaseSearchClear = () => {
    setPurchaseSearchTerm("")
    setPurchaseFilter("all")
    setFilteredPurchaseRequests(purchaseRequests)
  }

  const handleSaveProductActions = async (productId: number, actions: string) => {
    try {
      const { error } = await supabase.from("products").update({ custom_actions: actions }).eq("id", productId)

      if (error) throw error

      await fetchProducts()
      toast.success("Product actions saved!")
    } catch (error) {
      toast.error("Failed to save product actions")
      console.error("Save actions error:", error)
    }
  }

  const updateAdminSetting = async (key: string, value: string) => {
    try {
      console.log(`Updating setting: ${key} = ${value}`)

      // First try to update existing setting
      const { data: updateData, error: updateError } = await supabase
        .from("admin_settings")
        .update({
          setting_value: value,
          updated_at: new Date().toISOString(),
        })
        .eq("setting_key", key)
        .select()

      if (updateError) {
        console.error("Update error:", updateError)
        // If update fails, try insert
        const { error: insertError } = await supabase.from("admin_settings").insert([
          {
            setting_key: key,
            setting_value: value,
          },
        ])

        if (insertError) {
          console.error("Insert error:", insertError)
          toast.error("Error updating setting: " + insertError.message)
          return
        }
      }

      // Update local state
      setAdminSettings({ ...adminSettings, [key]: value })
      toast.success("Setting updated successfully!")

      // Refresh settings from database to ensure consistency
      await fetchAdminSettings()
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("Unexpected error updating setting")
    }
  }

  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const generateUniqueId = (name: string) => {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
    const nameStr = name
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 4)
      .toUpperCase()
    return `${nameStr}-${timestamp}-${randomStr}`
  }

  const handleAddCategory = async () => {
    if (!hasPermission("manage_categories")) {
      toast.error("You don't have permission to manage categories")
      return
    }

    if (!newCategory.name) return

    const slug = newCategory.slug || createSlug(newCategory.name)
    const { error } = await supabase.from("categories").insert([{ name: newCategory.name, slug }])

    if (error) {
      toast.error("Error adding category: " + error.message)
      return
    }

    setNewCategory({ name: "", slug: "" })
    fetchCategories()
    toast.success("Category added!")
  }

  const handleAddSubcategory = async () => {
    if (!hasPermission("manage_categories")) {
      toast.error("You don't have permission to manage categories")
      return
    }

    if (!newSubcategory.name || !newSubcategory.category_id) return

    const slug = newSubcategory.slug || createSlug(newSubcategory.name)
    const { error } = await supabase.from("subcategories").insert([
      {
        name: newSubcategory.name,
        slug,
        category_id: Number.parseInt(newSubcategory.category_id),
      },
    ])

    if (error) {
      toast.error("Error adding subcategory: " + error.message)
      return
    }

    setNewSubcategory({ name: "", slug: "", category_id: "" })
    fetchSubcategories()
    toast.success("Subcategory added!")
  }

  const handleAddProduct = async () => {
    if (!hasPermission("manage_products")) {
      toast.error("You don't have permission to manage products")
      return
    }

    if (!newProduct.name || !newProduct.price || !newProduct.subcategory_id || !newProduct.stock) return

    let specifications = {}
    try {
      specifications = JSON.parse(newProduct.specifications)
    } catch (e) {
      toast.error("Invalid JSON in specifications")
      return
    }

    const uniqueId = newProduct.unique_id || generateUniqueId(newProduct.name)

    const { error } = await supabase.from("products").insert([
      {
        name: newProduct.name,
        description: newProduct.description,
        price: Number.parseFloat(newProduct.price),
        image_url: newProduct.image_url,
        subcategory_id: Number.parseInt(newProduct.subcategory_id),
        specifications,
        stock: Number.parseInt(newProduct.stock),
        unique_id: uniqueId,
      },
    ])

    if (error) {
      toast.error("Error adding product: " + error.message)
      return
    }

    setNewProduct({
      name: "",
      description: "",
      price: "",
      image_url: "",
      subcategory_id: "",
      specifications: "{}",
      stock: "",
      unique_id: "",
    })
    fetchProducts()
    toast.success("Product added!")
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct) return

    let specifications = {}
    try {
      specifications = JSON.parse(JSON.stringify(editingProduct.specifications))
    } catch (e) {
      toast.error("Invalid specifications")
      return
    }

    const { error } = await supabase
      .from("products")
      .update({
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        image_url: editingProduct.image_url,
        stock: editingProduct.stock,
        specifications,
        unique_id: editingProduct.unique_id,
      })
      .eq("id", editingProduct.id)

    if (error) {
      toast.error("Error updating product: " + error.message)
      return
    }

    setEditingProduct(null)
    fetchProducts()
    toast.success("Product updated!")
  }

  const handleAddSale = async (percentage: number) => {
    if (!saleProduct) return

    const { error } = await supabase
      .from("products")
      .update({
        sale_percentage: percentage,
        sale_active: true,
      })
      .eq("id", saleProduct.id)

    if (error) {
      toast.error("Error adding sale: " + error.message)
      return
    }

    setSaleProduct(null)
    setSalePercentage("")
    fetchProducts()
    toast.success(`${percentage}% sale added!`)
  }

  const handleRemoveSale = async (productId: number) => {
    const { error } = await supabase
      .from("products")
      .update({
        sale_percentage: 0,
        sale_active: false,
        sale_price: null,
      })
      .eq("id", productId)

    if (error) {
      toast.error("Error removing sale: " + error.message)
      return
    }

    fetchProducts()
    toast.success("Sale removed!")
  }

  const handleMakeAdmin = async (userId: number) => {
    if (!hasPermission("manage_users")) {
      toast.error("You don't have permission to manage users")
      return
    }

    const { error } = await supabase.from("users").update({ is_admin: true }).eq("id", userId)

    if (error) {
      toast.error("Error making user admin: " + error.message)
      return
    }

    fetchUsers()
    toast.success("User promoted to admin!")
  }

  const handleRemoveAdmin = async (userId: number) => {
    if (!hasPermission("manage_users")) {
      toast.error("You don't have permission to manage users")
      return
    }

    const { error } = await supabase.from("users").update({ is_admin: false }).eq("id", userId)

    if (error) {
      toast.error("Error removing admin: " + error.message)
      return
    }

    fetchUsers()
    toast.success("Admin privileges removed!")
  }

  const handleCompletePurchase = async (purchaseId: number) => {
    if (!hasPermission("process_orders")) {
      toast.error("You don't have permission to process orders")
      return
    }

    try {
      await completePurchase(purchaseId)
      fetchPurchaseRequests()
      toast.success("Purchase marked as completed!")
    } catch (error) {
      toast.error("Error completing purchase")
    }
  }

  const handleCancelPurchase = async (purchaseId: number) => {
    if (!hasPermission("process_orders")) {
      toast.error("You don't have permission to process orders")
      return
    }

    try {
      await cancelPurchase(purchaseId)
      fetchPurchaseRequests()
      toast.success("Purchase cancelled and stock restored!")
    } catch (error) {
      toast.error("Error cancelling purchase")
    }
  }

  const handleMarkNotificationRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId)
      fetchNotifications()
    } catch (error) {
      toast.error("Error marking notification as read")
    }
  }

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsAsRead()
      fetchNotifications()
      toast.success("All notifications marked as read!")
    } catch (error) {
      toast.error("Error marking notifications as read")
    }
  }

  const deleteSubcategory = async (id: number) => {
    if (!hasPermission("manage_categories")) {
      toast.error("You don't have permission to manage categories")
      return
    }

    const { error } = await supabase.from("subcategories").delete().eq("id", id)
    if (!error) {
      fetchSubcategories()
      toast.success("Subcategory deleted!")
    } else {
      toast.error("Error deleting subcategory: " + error.message)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name)
      case "price":
        return a.price - b.price
      case "stock":
        return a.stock - b.stock
      case "category":
        const subA = subcategories.find((s) => s.id === a.subcategory_id)
        const subB = subcategories.find((s) => s.id === b.subcategory_id)
        const catA = categories.find((c) => c.id === subA?.category_id)
        const catB = categories.find((c) => c.id === subB?.category_id)
        return (catA?.name || "").localeCompare(catB?.name || "")
      default:
        return 0
    }
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="premium-card">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-400 mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-4">Please log in to access the admin panel.</p>
            <Link href="/">
              <Button>Go Back to Store</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hasPermission("admin_panel_access")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="premium-card">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-400 mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-4">You need admin panel access permission to view this page.</p>
            <Link href="/">
              <Button>Go Back to Store</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-green-500/20 bg-slate-900/50 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                Admin Panel
              </h1>
            </div>
            {/* In the header section, replace the existing buttons with: */}
            <div className="flex items-center gap-4">
              <Link href="/guide">
                <Button
                  variant="outline"
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 bg-transparent"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Admin Guide
                </Button>
              </Link>
              {hasPermission("manage_products") && <ImageUploader />}
              {hasPermission("manage_settings") && (
                <RarityColorsManager
                  rarityColors={JSON.parse(adminSettings.rarity_colors || "{}")}
                  rarityOrder={JSON.parse(adminSettings.rarity_order || "[]")}
                  onUpdate={(colors, order) => {
                    updateAdminSetting("rarity_colors", JSON.stringify(colors))
                    updateAdminSetting("rarity_order", JSON.stringify(order))
                  }}
                />
              )}
              {hasPermission("manage_settings") && (
                <PaymentMethodsManager
                  paymentMethods={JSON.parse(adminSettings.payment_methods || "{}")}
                  onUpdate={(methods) => updateAdminSetting("payment_methods", JSON.stringify(methods))}
                />
              )}
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                <Crown className="w-3 h-3 mr-1" />
                Admin Access
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8 bg-slate-800/50 border border-green-500/20">
            {hasPermission("manage_products") && (
              <TabsTrigger
                value="products"
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
              >
                <Package className="w-4 h-4 mr-2" />
                Products
              </TabsTrigger>
            )}
            {hasPermission("manage_categories") && (
              <TabsTrigger
                value="categories"
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
              >
                Categories
              </TabsTrigger>
            )}
            {hasPermission("view_users") && (
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
              >
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
            )}
            {hasPermission("view_orders") && (
              <TabsTrigger
                value="purchases"
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
              >
                Purchase Requests
              </TabsTrigger>
            )}
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications ({notifications.filter((n) => !n.is_read).length})
            </TabsTrigger>
            {hasPermission("manage_settings") && (
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            )}
          </TabsList>

          {/* Products Tab */}
          {hasPermission("manage_products") && (
            <TabsContent value="products" className="space-y-6">
              {/* Search and Sort */}
              <Card className="bg-slate-800/50 border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search products..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-slate-700 border-slate-600"
                        />
                      </div>
                    </div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-48 bg-slate-700 border-slate-600">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="stock">Stock</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Add Product */}
              <Card className="bg-slate-800/50 border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-green-400">Add New Product</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="product-subcategory">Subcategory</Label>
                      <Select
                        value={newProduct.subcategory_id}
                        onValueChange={(value) => setNewProduct({ ...newProduct, subcategory_id: value })}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600">
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {subcategories
                            .sort((a, b) => {
                              const catA = categories.find((c) => c.id === a.category_id)
                              const catB = categories.find((c) => c.id === b.category_id)
                              const categoryCompare = (catA?.name || "").localeCompare(catB?.name || "")
                              if (categoryCompare !== 0) return categoryCompare
                              return a.name.localeCompare(b.name)
                            })
                            .map((subcategory) => {
                              const category = categories.find((c) => c.id === subcategory.category_id)
                              return (
                                <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                                  {category?.name} - {subcategory.name}
                                </SelectItem>
                              )
                            })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="product-name">Name</Label>
                      <Input
                        id="product-name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="product-unique-id">Unique ID</Label>
                      <Input
                        id="product-unique-id"
                        value={newProduct.unique_id}
                        onChange={(e) => setNewProduct({ ...newProduct, unique_id: e.target.value })}
                        placeholder="Auto-generated if empty"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="product-price">Price (€)</Label>
                      <Input
                        id="product-price"
                        type="number"
                        step="0.01"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="product-stock">Stock</Label>
                      <Input
                        id="product-stock"
                        type="number"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="product-image">Image URL</Label>
                      <Input
                        id="product-image"
                        value={newProduct.image_url}
                        onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="product-description">Description</Label>
                    <Textarea
                      id="product-description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="product-specifications">Specifications (JSON)</Label>
                    <Textarea
                      id="product-specifications"
                      value={newProduct.specifications}
                      onChange={(e) => setNewProduct({ ...newProduct, specifications: e.target.value })}
                      placeholder='{"rarity": "Legendary", "enchantments": ["Efficiency V"]}'
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <Button onClick={handleAddProduct} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </CardContent>
              </Card>

              {/* Products List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedProducts.map((product) => {
                  const subcategory = subcategories.find((s) => s.id === product.subcategory_id)
                  const category = categories.find((c) => c.id === subcategory?.category_id)
                  const lowStockThreshold = Number.parseInt(adminSettings.low_stock_threshold || "3")

                  return (
                    <Card key={product.id} className="bg-slate-800/50 border-green-500/20">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-white text-sm">{product.name}</CardTitle>
                            <CardDescription>
                              {category?.name} - {subcategory?.name}
                            </CardDescription>
                            <p className="text-xs text-gray-400 font-mono">ID: {product.unique_id}</p>
                          </div>
                          <Badge
                            className={
                              product.stock <= lowStockThreshold
                                ? "bg-red-500/20 text-red-400"
                                : "bg-green-500/20 text-green-400"
                            }
                          >
                            Stock: {product.stock}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {(product as any).sale_active ? (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 line-through text-sm">{formatPrice(product.price)}</span>
                                <span className="text-green-400 font-bold">
                                  {formatPrice((product as any).sale_price)}
                                </span>
                                <Badge className="bg-red-500/20 text-red-400 text-xs">
                                  -{(product as any).sale_percentage}%
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-blue-400 font-bold">{formatPrice(product.price)}</span>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingProduct(product)}
                                  className="flex-1"
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl bg-slate-900 border-green-500/30">
                                <DialogHeader>
                                  <DialogTitle className="text-green-400">Edit Product</DialogTitle>
                                </DialogHeader>
                                {editingProduct && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Name</Label>
                                        <Input
                                          value={editingProduct.name}
                                          onChange={(e) =>
                                            setEditingProduct({ ...editingProduct, name: e.target.value })
                                          }
                                          className="bg-slate-700 border-slate-600"
                                        />
                                      </div>
                                      <div>
                                        <Label>Unique ID</Label>
                                        <Input
                                          value={editingProduct.unique_id || ""}
                                          onChange={(e) =>
                                            setEditingProduct({ ...editingProduct, unique_id: e.target.value })
                                          }
                                          className="bg-slate-700 border-slate-600"
                                        />
                                      </div>
                                      <div>
                                        <Label>Price (€)</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={editingProduct.price}
                                          onChange={(e) =>
                                            setEditingProduct({
                                              ...editingProduct,
                                              price: Number.parseFloat(e.target.value),
                                            })
                                          }
                                          className="bg-slate-700 border-slate-600"
                                        />
                                      </div>
                                      <div>
                                        <Label>Stock</Label>
                                        <Input
                                          type="number"
                                          value={editingProduct.stock}
                                          onChange={(e) =>
                                            setEditingProduct({
                                              ...editingProduct,
                                              stock: Number.parseInt(e.target.value),
                                            })
                                          }
                                          className="bg-slate-700 border-slate-600"
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <Label>Image URL</Label>
                                        <Input
                                          value={editingProduct.image_url}
                                          onChange={(e) =>
                                            setEditingProduct({ ...editingProduct, image_url: e.target.value })
                                          }
                                          className="bg-slate-700 border-slate-600"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Description</Label>
                                      <Textarea
                                        value={editingProduct.description}
                                        onChange={(e) =>
                                          setEditingProduct({ ...editingProduct, description: e.target.value })
                                        }
                                        className="bg-slate-700 border-slate-600"
                                      />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <Label>Specifications (JSON)</Label>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            const newSpecs = prompt(
                                              "Edit JSON specifications:",
                                              JSON.stringify(editingProduct.specifications, null, 2),
                                            )
                                            if (newSpecs) {
                                              try {
                                                const parsed = JSON.parse(newSpecs)
                                                setEditingProduct({ ...editingProduct, specifications: parsed })
                                                toast.success("JSON updated!")
                                              } catch (e) {
                                                toast.error("Invalid JSON format")
                                              }
                                            }
                                          }}
                                          className="border-yellow-500/50 text-yellow-400"
                                        >
                                          <Edit className="w-3 h-3 mr-1" />
                                          Edit JSON
                                        </Button>
                                      </div>
                                      <Textarea
                                        value={JSON.stringify(editingProduct.specifications, null, 2)}
                                        onChange={(e) => {
                                          try {
                                            const parsed = JSON.parse(e.target.value)
                                            setEditingProduct({ ...editingProduct, specifications: parsed })
                                          } catch (e) {
                                            // Invalid JSON, but allow typing
                                          }
                                        }}
                                        className="bg-slate-700 border-slate-600 font-mono text-sm"
                                        rows={6}
                                      />
                                    </div>
                                    <Button onClick={handleUpdateProduct} className="bg-green-600 hover:bg-green-700">
                                      Update Product
                                    </Button>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            <ProductActionsEditor
                              productId={product.id}
                              currentActions={(product as any).custom_actions || ""}
                              onSave={(actions) => handleSaveProductActions(product.id, actions)}
                            />

                            {(product as any).sale_active ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveSale(product.id)}
                                className="border-red-500/50 text-red-400"
                              >
                                Remove Sale
                              </Button>
                            ) : (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSaleProduct(product)}
                                    className="border-yellow-500/50 text-yellow-400"
                                  >
                                    <Percent className="w-3 h-3 mr-1" />
                                    Add Sale
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 border-yellow-500/30">
                                  <DialogHeader>
                                    <DialogTitle className="text-yellow-400">
                                      Add Sale to {saleProduct?.name}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <Button
                                        onClick={() => handleAddSale(10)}
                                        className="bg-yellow-600 hover:bg-yellow-700"
                                      >
                                        10% Off
                                      </Button>
                                      <Button
                                        onClick={() => handleAddSale(20)}
                                        className="bg-yellow-600 hover:bg-yellow-700"
                                      >
                                        20% Off
                                      </Button>
                                      <Button
                                        onClick={() => handleAddSale(50)}
                                        className="bg-yellow-600 hover:bg-yellow-700"
                                      >
                                        50% Off
                                      </Button>
                                      <div className="flex gap-2">
                                        <Input
                                          type="number"
                                          placeholder="Custom %"
                                          value={salePercentage}
                                          onChange={(e) => setSalePercentage(e.target.value)}
                                          className="bg-slate-700 border-slate-600"
                                        />
                                        <Button
                                          onClick={() => {
                                            const percentage = Number.parseInt(salePercentage)
                                            if (percentage > 0 && percentage <= 99) {
                                              handleAddSale(percentage)
                                            } else {
                                              toast.error("Enter a valid percentage (1-99)")
                                            }
                                          }}
                                          className="bg-yellow-600 hover:bg-yellow-700"
                                        >
                                          Apply
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                const { error } = await supabase.from("products").delete().eq("id", product.id)
                                if (!error) {
                                  fetchProducts()
                                  toast.success("Product deleted!")
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          )}

          {/* Categories Tab */}
          {hasPermission("manage_categories") && (
            <TabsContent value="categories" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Category */}
                <Card className="bg-slate-800/50 border-green-500/20">
                  <CardHeader>
                    <CardTitle className="text-green-400">Add New Category</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="category-name">Name</Label>
                      <Input
                        id="category-name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category-slug">Slug (optional)</Label>
                      <Input
                        id="category-slug"
                        value={newCategory.slug}
                        onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <Button onClick={handleAddCategory} className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </CardContent>
                </Card>

                {/* Add Subcategory */}
<Card className="bg-slate-800/50 border-green-500/20">
  <CardHeader>
    <CardTitle className="text-green-400">Add New Subcategory</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <Label htmlFor="subcategory-category">Category</Label>
      <Select
        value={newSubcategory.category_id}
        onValueChange={(value) => setNewSubcategory({ ...newSubcategory, category_id: value })}
      >
        <SelectTrigger className="bg-slate-700 border-slate-600">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {categories
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label htmlFor="subcategory-name">Name</Label>
      <Input
        id="subcategory-name"
        value={newSubcategory.name}
        onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
        className="bg-slate-700 border-slate-600"
      />
    </div>
    <div>
      <Label htmlFor="subcategory-slug">Slug (optional)</Label>
      <Input
        id="subcategory-slug"
        value={newSubcategory.slug}
        onChange={(e) => setNewSubcategory({ ...newSubcategory, slug: e.target.value })}
        className="bg-slate-700 border-slate-600"
      />
    </div>
    <Button onClick={handleAddSubcategory} className="bg-green-600 hover:bg-green-700">
      <Plus className="h-4 w-4 mr-2" />
      Add Subcategory
    </Button>
  </CardContent>
</Card>
                
              {/* Categories List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Categories */}
                <div>
                  <h3 className="text-xl font-semibold text-green-400 mb-4">Categories</h3>
                  <div className="space-y-3">
                    {categories
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((category) => (
                        <Card key={category.id} className="bg-slate-800/50 border-green-500/20">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-semibold text-white">{category.name}</p>
                                <p className="text-sm text-gray-400">
                                  Subcategories: {subcategories.filter((s) => s.category_id === category.id).length}
                                </p>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                  const { error } = await supabase.from("categories").delete().eq("id", category.id)
                                  if (!error) {
                                    fetchCategories()
                                    toast.success("Category deleted!")
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>

                {/* Subcategories */}
                <div>
                  <h3 className="text-xl font-semibold text-green-400 mb-4">Subcategories</h3>
                  <div className="space-y-3">
                    {subcategories
                      .sort((a, b) => {
                        const catA = categories.find((c) => c.id === a.category_id)
                        const catB = categories.find((c) => c.id === b.category_id)
                        const categoryCompare = (catA?.name || "").localeCompare(catB?.name || "")
                        if (categoryCompare !== 0) return categoryCompare
                        return a.name.localeCompare(b.name)
                      })
                      .map((subcategory) => {
                        const category = categories.find((c) => c.id === subcategory.category_id)
                        return (
                          <Card key={subcategory.id} className="bg-slate-800/50 border-green-500/20">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-semibold text-white">{subcategory.name}</p>
                                  <p className="text-sm text-gray-400">{category?.name}</p>
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteSubcategory(subcategory.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                  </div>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Users Tab */}
          {hasPermission("view_users") && (
            <TabsContent value="users" className="space-y-6">
              <Card className="bg-slate-800/50 border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-green-400">User Management</CardTitle>
                  <CardDescription>Manage user accounts and admin permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                        <div>
                          <p className="font-semibold text-white">{u.email}</p>
                          <p className="text-sm text-gray-400">Joined: {formatDate(u.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={u.is_admin ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}
                          >
                            {u.is_admin ? "Admin" : "User"}
                          </Badge>
                          {u.id !== user.id && hasPermission("manage_users") && (
                            <Button
                              size="sm"
                              variant={u.is_admin ? "destructive" : "default"}
                              onClick={() => (u.is_admin ? handleRemoveAdmin(u.id) : handleMakeAdmin(u.id))}
                            >
                              {u.is_admin ? "Remove Admin" : "Make Admin"}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* User Permissions Manager */}
              {hasPermission("manage_permissions") && <UserPermissionsManager users={users} onRefresh={fetchUsers} />}
            </TabsContent>
          )}

          {/* Purchase Requests Tab */}
          {hasPermission("view_orders") && (
            <TabsContent value="purchases" className="space-y-6">
              <Card className="bg-slate-800/50 border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-green-400">Purchase Requests</CardTitle>
                  <CardDescription>Manage customer purchase requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <PurchaseSearch onSearch={handlePurchaseSearch} onClear={handlePurchaseSearchClear} />

                    <div className="text-sm text-gray-400">
                      Showing {filteredPurchaseRequests.length} of {purchaseRequests.length} requests
                    </div>

                    <div className="space-y-4">
                      {filteredPurchaseRequests.map((request) => (
                        <Card key={request.id} className="bg-slate-700/50 border-slate-600">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <p className="font-mono text-blue-400">{request.purchase_id}</p>
                                <p className="text-sm text-gray-400">
                                  {request.user.email} • {formatDate(request.created_at)}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge
                                  className={
                                    request.status === "pending"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : request.status === "completed"
                                        ? "bg-green-500/20 text-green-400"
                                        : "bg-red-500/20 text-red-400"
                                  }
                                >
                                  {request.status.toUpperCase()}
                                </Badge>
                                <p className="text-lg font-bold text-white">{formatPrice(request.total_price)}</p>
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              <p className="text-sm font-semibold text-gray-300">Items:</p>
                              {request.items.map((item: any, index: number) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-gray-300">
                                    {item.name} x{item.quantity}
                                  </span>
                                  <span className="text-blue-400">{formatPrice(item.total)}</span>
                                </div>
                              ))}
                            </div>

                            {request.status === "pending" && (
                              <div className="flex gap-2">
                                {hasPermission("generate_payment_links") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => generatePaymentLink(request)}
                                    className="border-blue-500/50 text-blue-400"
                                  >
                                    <LinkIcon className="w-4 h-4 mr-1" />
                                    Generate Payment Link
                                  </Button>
                                )}
                                {hasPermission("process_orders") && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => handleCompletePurchase(request.id)}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Complete
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleCancelPurchase(request.id)}
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Cancel
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-slate-800/50 border-green-500/20">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-green-400">Notifications</CardTitle>
                    <CardDescription>System alerts and low stock warnings</CardDescription>
                  </div>
                  <Button size="sm" onClick={handleMarkAllNotificationsRead}>
                    Mark All Read
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          notification.is_read
                            ? "bg-slate-700/30 border-slate-600"
                            : "bg-blue-500/10 border-blue-500/30"
                        }`}
                        onClick={() => !notification.is_read && handleMarkNotificationRead(notification.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-white">{notification.title}</p>
                            <p className="text-sm text-gray-300">{notification.message}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">{formatDate(notification.created_at)}</p>
                            {!notification.is_read && <div className="w-2 h-2 bg-blue-400 rounded-full mt-1 ml-auto" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          {hasPermission("manage_settings") && (
            <TabsContent value="settings" className="space-y-6">
              {/* Discount Codes Manager */}
              {hasPermission("manage_discount_codes") && <DiscountCodesManager products={products} />}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-800/50 border-green-500/20">
                  <CardHeader>
                    <CardTitle className="text-green-400">Store Settings</CardTitle>
                    <CardDescription>Configure basic store information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="store-name">Store Name</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="store-name"
                          value={adminSettings.store_name || ""}
                          onChange={(e) => setAdminSettings({ ...adminSettings, store_name: e.target.value })}
                          className="bg-slate-700 border-slate-600"
                        />
                        <Button
                          onClick={() => updateAdminSetting("store_name", adminSettings.store_name || "")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Save
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="currency-symbol">Currency Symbol</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="currency-symbol"
                          value={adminSettings.currency_symbol || ""}
                          onChange={(e) => setAdminSettings({ ...adminSettings, currency_symbol: e.target.value })}
                          className="bg-slate-700 border-slate-600 w-20"
                        />
                        <Button
                          onClick={() => updateAdminSetting("currency_symbol", adminSettings.currency_symbol || "")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Save
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="support-email">Support Email</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="support-email"
                          type="email"
                          value={adminSettings.support_email || ""}
                          onChange={(e) => setAdminSettings({ ...adminSettings, support_email: e.target.value })}
                          className="bg-slate-700 border-slate-600"
                        />
                        <Button
                          onClick={() => updateAdminSetting("support_email", adminSettings.support_email || "")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Save
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="delivery-time">Delivery Time</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="delivery-time"
                          value={adminSettings.delivery_time || ""}
                          onChange={(e) => setAdminSettings({ ...adminSettings, delivery_time: e.target.value })}
                          className="bg-slate-700 border-slate-600"
                          placeholder="e.g., 24 hours"
                        />
                        <Button
                          onClick={() => updateAdminSetting("delivery_time", adminSettings.delivery_time || "")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-green-500/20">
                  <CardHeader>
                    <CardTitle className="text-green-400">System Settings</CardTitle>
                    <CardDescription>Configure system behavior and thresholds</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="low-stock-threshold">Low Stock Threshold</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="low-stock-threshold"
                          type="number"
                          value={adminSettings.low_stock_threshold || ""}
                          onChange={(e) => setAdminSettings({ ...adminSettings, low_stock_threshold: e.target.value })}
                          className="bg-slate-700 border-slate-600 w-32"
                        />
                        <Button
                          onClick={() =>
                            updateAdminSetting("low_stock_threshold", adminSettings.low_stock_threshold || "")
                          }
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Save
                        </Button>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Products with stock at or below this number will trigger notifications
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="discord-link">Discord Server Link</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="discord-link"
                          value={adminSettings.discord_server_link || ""}
                          onChange={(e) => setAdminSettings({ ...adminSettings, discord_server_link: e.target.value })}
                          className="bg-slate-700 border-slate-600"
                          placeholder="https://discord.gg/yourserver"
                        />
                        <Button
                          onClick={() =>
                            updateAdminSetting("discord_server_link", adminSettings.discord_server_link || "")
                          }
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Save
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(adminSettings.discord_server_link || "", "_blank")}
                          disabled={!adminSettings.discord_server_link}
                          className="border-blue-500/50 text-blue-400"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Test Link
                        </Button>
                        <p className="text-xs text-gray-400">
                          This link will be shown to customers for payment completion
                        </p>
                      </div>
                    </div>

                    {hasPermission("maintenance_mode") && (
                      <div>
                        <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Button
                            onClick={async () => {
                              const currentMode = adminSettings.maintenance_mode === "true"
                              const newMode = !currentMode
                              await updateAdminSetting("maintenance_mode", newMode.toString())
                            }}
                            className={`${
                              adminSettings.maintenance_mode === "true"
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {adminSettings.maintenance_mode === "true" ? "Enabled" : "Disabled"}
                          </Button>
                          <span className="text-sm text-gray-400">
                            {adminSettings.maintenance_mode === "true"
                              ? "Store is in maintenance mode"
                              : "Store is accessible to users"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          When enabled, only users with maintenance_mode permission can access the store
                        </p>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="testing-mode">Testing Mode</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          onClick={async () => {
                            const currentMode = adminSettings.testing_mode === "true"
                            const newMode = !currentMode
                            await updateAdminSetting("testing_mode", newMode.toString())
                          }}
                          className={`${
                            adminSettings.testing_mode === "true"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-red-600 hover:bg-red-700"
                          }`}
                        >
                          {adminSettings.testing_mode === "true" ? "Enabled" : "Disabled"}
                        </Button>
                        <span className="text-sm text-gray-400">
                          {adminSettings.testing_mode === "true"
                            ? "Quick login buttons visible"
                            : "Quick login buttons hidden"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        When disabled, removes quick login buttons and setup links from login page for production use
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-800/50 border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-green-400">Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 bg-transparent"
                      onClick={() => window.location.reload()}
                    >
                      Refresh Data
                    </Button>
                    <Button
                      variant="outline"
                      className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 bg-transparent"
                      onClick={() => {
                        const data = {
                          categories: categories.length,
                          subcategories: subcategories.length,
                          products: products.length,
                          users: users.length,
                          pending_orders: purchaseRequests.filter((r) => r.status === "pending").length,
                          unread_notifications: notifications.filter((n) => !n.is_read).length,
                        }
                        console.log("Store Statistics:", data)
                        toast.success("Statistics logged to console")
                      }}
                    >
                      View Statistics
                    </Button>
                    <Link href="/guide">
                      <Button
                        variant="outline"
                        className="w-full border-green-500/50 text-green-400 hover:bg-green-500/10 bg-transparent"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        View Admin Guide
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}
