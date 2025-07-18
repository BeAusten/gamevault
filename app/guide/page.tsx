"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  ShoppingCart,
  CreditCard,
  MessageCircle,
  AlertTriangle,
  Plus,
  Edit,
  Settings,
  Users,
  Bell,
  Crown,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function GuidePage() {
  const { user } = useAuth()
  const [adminSettings, setAdminSettings] = useState<{ [key: string]: string }>({})

  const fetchAdminSettings = async () => {
    const { data } = await supabase.from("admin_settings").select("*")
    if (data) {
      const settings: { [key: string]: string } = {}
      data.forEach((setting) => {
        settings[setting.setting_key] = setting.setting_value
      })
      setAdminSettings(settings)
    }
  }

  useEffect(() => {
    fetchAdminSettings()
  }, [])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="premium-card">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400 mb-4">Please log in to view the guide.</p>
            <Link href="/">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getDiscordLink = () => {
    return adminSettings.discord_server_link || "https://discord.gg/yourserver"
  }

  const getSupportEmail = () => {
    return adminSettings.support_email || "info@example.com"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-blue-500/20 bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-gaming font-bold text-blue-400">GameVault Guide</h1>
            </div>
            {user.is_admin && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                <Crown className="w-3 h-3 mr-1" />
                Admin Access
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue={user.is_admin ? "admin" : "user"} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-800/50 border border-blue-500/20">
              <TabsTrigger
                value="user"
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
              >
                User Guide
              </TabsTrigger>
              {user.is_admin && (
                <TabsTrigger
                  value="admin"
                  className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400"
                >
                  Admin Guide
                </TabsTrigger>
              )}
            </TabsList>

            {/* User Guide */}
            <TabsContent value="user" className="space-y-6">
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-blue-400 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    How to Purchase Items
                  </CardTitle>
                  <CardDescription>Step-by-step guide to buying items from GameVault</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Badge className="bg-blue-500/20 text-blue-400 min-w-[24px] h-6 flex items-center justify-center">
                        1
                      </Badge>
                      <div>
                        <p className="font-semibold text-white">Browse Products</p>
                        <p className="text-gray-400 text-sm">
                          Navigate through categories (Minecraft, Roblox, GTA V, Fortnite) to find items you want.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="bg-blue-500/20 text-blue-400 min-w-[24px] h-6 flex items-center justify-center">
                        2
                      </Badge>
                      <div>
                        <p className="font-semibold text-white">Add to Cart</p>
                        <p className="text-gray-400 text-sm">
                          Click "Add to Cart" on items you want to purchase. Check stock availability first!
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="bg-blue-500/20 text-blue-400 min-w-[24px] h-6 flex items-center justify-center">
                        3
                      </Badge>
                      <div>
                        <p className="font-semibold text-white">Review Cart</p>
                        <p className="text-gray-400 text-sm">
                          Click the cart icon to review your items and adjust quantities if needed.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="bg-blue-500/20 text-blue-400 min-w-[24px] h-6 flex items-center justify-center">
                        4
                      </Badge>
                      <div>
                        <p className="font-semibold text-white">Create Purchase Request</p>
                        <p className="text-gray-400 text-sm">
                          Click "Create Purchase Request" to generate your unique Purchase ID.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="bg-blue-500/20 text-blue-400 min-w-[24px] h-6 flex items-center justify-center">
                        5
                      </Badge>
                      <div>
                        <p className="font-semibold text-white">Join Discord & Pay</p>
                        <p className="text-gray-400 text-sm">
                          Join our Discord server and provide your Purchase ID to complete payment.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Discord Payment Process
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 font-semibold mb-2">Payment Methods Accepted:</p>
                    <div className="space-y-2">
                      {(() => {
                        const paymentMethods = JSON.parse(
                          adminSettings.payment_methods || '{"paypal": true, "crypto": true, "gift_cards": true}',
                        )
                        const methods = []

                        if (paymentMethods.paypal) methods.push("• PayPal")
                        if (paymentMethods.bank_transfer) methods.push("• Bank Transfer (IBAN)")
                        if (paymentMethods.crypto) methods.push("• Cryptocurrency (Bitcoin, Ethereum)")
                        if (paymentMethods.gift_cards) methods.push("• Gift Cards (Steam, Amazon)")
                        if (paymentMethods.cash_app) methods.push("• Cash App")

                        return methods.length > 0 ? (
                          <ul className="text-gray-300 text-sm space-y-1">
                            {methods.map((method, index) => (
                              <li key={index}>{method}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-400 text-sm">No payment methods configured</p>
                        )
                      })()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-white font-semibold">What to do in Discord:</p>
                    <ol className="text-gray-400 text-sm space-y-1 ml-4">
                      <li>1. Go to #purchase-requests channel</li>
                      <li>2. Send your Purchase ID (e.g., PUR-1234567890-ABC123)</li>
                      <li>3. Wait for admin confirmation</li>
                      <li>4. Complete payment via provided method</li>
                      <li>5. Receive your items within {adminSettings.delivery_time || "24 hours"}</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Troubleshooting
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-white">Item Out of Stock</p>
                      <p className="text-gray-400 text-sm">
                        If an item shows "Out of Stock", it's temporarily unavailable. Check back later or contact
                        support for restock information.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Payment Issues</p>
                      <p className="text-gray-400 text-sm">
                        If you have payment problems, contact an admin in Discord with your Purchase ID. We'll help
                        resolve any issues.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Didn't Receive Items</p>
                      <p className="text-gray-400 text-sm">
                        Items are delivered within {adminSettings.delivery_time || "24 hours"}. If you haven't received
                        them, check your Purchase History in your Profile and contact support at {getSupportEmail()}.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Wrong Items Received</p>
                      <p className="text-gray-400 text-sm">
                        Contact support immediately at {getSupportEmail()} with your Purchase ID. We'll investigate and
                        provide the correct items or refund.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-purple-400">Account Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-white">Profile Page</p>
                      <p className="text-gray-400 text-sm">
                        View your purchase history, track order status, and copy Purchase IDs for Discord.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Purchase Status</p>
                      <ul className="text-gray-400 text-sm space-y-1 ml-4">
                        <li>
                          • <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">PENDING</Badge> - Waiting for
                          payment
                        </li>
                        <li>
                          • <Badge className="bg-green-500/20 text-green-400 text-xs">COMPLETED</Badge> - Items
                          delivered
                        </li>
                        <li>
                          • <Badge className="bg-red-500/20 text-red-400 text-xs">CANCELLED</Badge> - Order cancelled
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Admin Guide */}
            {user.is_admin && (
              <TabsContent value="admin" className="space-y-6">
                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle className="text-yellow-400 flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Adding Products
                    </CardTitle>
                    <CardDescription>How to add new products to the store</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Badge className="bg-yellow-500/20 text-yellow-400 min-w-[24px] h-6 flex items-center justify-center">
                          1
                        </Badge>
                        <div>
                          <p className="font-semibold text-white">Create Categories First</p>
                          <p className="text-gray-400 text-sm">
                            Go to Categories tab and add main categories (e.g., "Minecraft", "Roblox"). Categories are
                            automatically sorted alphabetically.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge className="bg-yellow-500/20 text-yellow-400 min-w-[24px] h-6 flex items-center justify-center">
                          2
                        </Badge>
                        <div>
                          <p className="font-semibold text-white">Add Subcategories</p>
                          <p className="text-gray-400 text-sm">
                            Create subcategories under each main category (e.g., "Pet Simulator" under "Roblox"). Also
                            sorted alphabetically.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Badge className="bg-yellow-500/20 text-yellow-400 min-w-[24px] h-6 flex items-center justify-center">
                          3
                        </Badge>
                        <div>
                          <p className="font-semibold text-white">Add Products</p>
                          <p className="text-gray-400 text-sm">
                            Fill in product details: name, price, stock, description, and specifications (JSON format).
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-400 font-semibold mb-2">Specifications JSON Example:</p>
                      <code className="text-gray-300 text-sm block bg-slate-800 p-2 rounded">
                        {`{
  "rarity": "Legendary",
  "enchantments": ["Efficiency V", "Unbreaking III"],
  "durability": "Unbreakable",
  "custom_texture": true
}`}
                      </code>
                    </div>
                  </CardContent>
                </Card>

                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle className="text-green-400 flex items-center gap-2">
                      <Edit className="w-5 h-5" />
                      Managing Products
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-white">Stock Management</p>
                        <p className="text-gray-400 text-sm">
                          Stock automatically decreases when customers purchase. You can manually edit stock levels by
                          clicking "Edit" on any product.
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Sales & Discounts</p>
                        <p className="text-gray-400 text-sm">
                          Click "Add Sale" on any product to apply discounts: 10%, 20%, 50%, or custom percentage. Sale
                          prices are automatically calculated.
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Low Stock Alerts</p>
                        <p className="text-gray-400 text-sm">
                          Automatic notifications when products reach low stock threshold (configurable in Settings).
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Search & Sort</p>
                        <p className="text-gray-400 text-sm">
                          Use search bar to find products quickly. Sort by name, price, stock, or category.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle className="text-purple-400 flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Processing Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-white">Purchase Requests Tab</p>
                        <p className="text-gray-400 text-sm">
                          All customer orders appear here with Purchase IDs, customer emails, and item details.
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Order Actions</p>
                        <ul className="text-gray-400 text-sm space-y-1 ml-4">
                          <li>
                            •{" "}
                            <Button size="sm" className="bg-green-600 text-xs h-6">
                              Complete
                            </Button>{" "}
                            - Mark as delivered (stock already reduced)
                          </li>
                          <li>
                            •{" "}
                            <Button size="sm" variant="destructive" className="text-xs h-6">
                              Cancel
                            </Button>{" "}
                            - Cancel order and restore stock
                          </li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Discord Integration</p>
                        <p className="text-gray-400 text-sm">
                          Set your Discord server link in Settings so customers know where to complete payment.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle className="text-red-400 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      User Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-white">Admin Privileges</p>
                        <p className="text-gray-400 text-sm">
                          Promote users to admin or remove admin privileges. Admins can access the admin panel and
                          manage the store.
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-white">User Activity</p>
                        <p className="text-gray-400 text-sm">
                          View user registration dates and account types. Monitor customer activity and purchase
                          history.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle className="text-orange-400 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      System Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-white">Low Stock Threshold</p>
                        <p className="text-gray-400 text-sm">
                          Set when to receive low stock notifications (default: 3 items).
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Discord Server Link</p>
                        <p className="text-gray-400 text-sm">
                          Set your Discord invite link for customers to complete purchases.
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Store Information</p>
                        <p className="text-gray-400 text-sm">
                          Configure store name, currency, payment methods, and other basic settings.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle className="text-blue-400 flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notifications System
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-white">Automatic Alerts</p>
                        <ul className="text-gray-400 text-sm space-y-1 ml-4">
                          <li>• New purchase requests</li>
                          <li>• Low stock warnings</li>
                          <li>• Order completions</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Managing Notifications</p>
                        <p className="text-gray-400 text-sm">
                          Click notifications to mark as read, or use "Mark All Read" to clear all notifications at
                          once.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  )
}
