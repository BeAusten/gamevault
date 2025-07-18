"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Copy } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

type PurchaseHistory = {
  id: number
  purchase_id: string
  items: any[]
  total_price: number
  status: string
  created_at: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [purchases, setPurchases] = useState<PurchaseHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
    if (user) {
      fetchPurchases()
      fetchAdminSettings()
    }
  }, [user])

  const fetchPurchases = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("purchase_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setPurchases(data || [])
    } catch (error) {
      console.error("Error fetching purchases:", error)
      toast.error("Failed to load purchase history")
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-400" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <Package className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  const copyPurchaseId = (purchaseId: string) => {
    navigator.clipboard.writeText(purchaseId)
    toast.success("Purchase ID copied to clipboard!")
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Please log in to view your profile</p>
      </div>
    )
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
              <h1 className="text-2xl font-gaming font-bold text-blue-400">My Profile</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* User Info */}
          <Card className="premium-card mb-8">
            <CardHeader>
              <CardTitle className="text-blue-400">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="text-white font-semibold">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Account Type</p>
                  <Badge
                    className={user.is_admin ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}
                  >
                    {user.is_admin ? "Admin" : "User"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase History */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-blue-400">Purchase History</CardTitle>
              <CardDescription>View all your purchase requests and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading purchases...</p>
                </div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                  <p className="text-gray-400">No purchases yet</p>
                  <Link href="/">
                    <Button className="mt-4 premium-button">Start Shopping</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    <Card key={purchase.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(purchase.status)}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-mono text-sm text-blue-400">{purchase.purchase_id}</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyPurchaseId(purchase.purchase_id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                              <p className="text-xs text-gray-400">{formatDate(purchase.created_at)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(purchase.status)}>{purchase.status.toUpperCase()}</Badge>
                            <p className="text-lg font-bold text-white mt-1">{formatPrice(purchase.total_price)}</p>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-gray-300">Items:</p>
                          {purchase.items.map((item: any, index: number) => (
                            <div
                              key={index}
                              className="flex justify-between items-center py-2 px-3 bg-slate-700/50 rounded"
                            >
                              <div>
                                <p className="text-white font-medium">{item.name}</p>
                                <p className="text-xs text-gray-400">Quantity: {item.quantity}</p>
                              </div>
                              <p className="text-blue-400 font-semibold">{formatPrice(item.total)}</p>
                            </div>
                          ))}
                        </div>

                        {purchase.status === "pending" && (
                          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                            <p className="text-sm text-yellow-400">
                              <strong>Next Steps:</strong> Join our Discord server with your Purchase ID to complete
                              payment.
                            </p>
                            <Button
                              size="sm"
                              className="mt-2 bg-yellow-600 hover:bg-yellow-700"
                              onClick={() => {
                                const discordLink =
                                  adminSettings?.discord_server_link || "https://discord.gg/yourserver"
                                window.open(discordLink, "_blank")
                              }}
                            >
                              Join Discord
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
