"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { getWalletStats, type WalletStats } from "@/lib/wallet"
import { TrendingUp, TrendingDown, Users, Package, ShoppingCart, Euro, Calendar, BarChart3 } from "lucide-react"

type StoreStats = {
  totalUsers: number
  totalProducts: number
  totalCategories: number
  totalSubcategories: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
  lowStockProducts: number
  totalRevenue: number
  monthlyRevenue: number
  averageOrderValue: number
  topSellingProducts: Array<{
    name: string
    sales: number
    revenue: number
  }>
}

export function StatisticsDashboard() {
  const [stats, setStats] = useState<StoreStats | null>(null)
  const [walletStats, setWalletStats] = useState<WalletStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      setLoading(true)

      // Fetch basic counts
      const [
        { count: usersCount },
        { count: productsCount },
        { count: categoriesCount },
        { count: subcategoriesCount },
      ] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("categories").select("*", { count: "exact", head: true }),
        supabase.from("subcategories").select("*", { count: "exact", head: true }),
      ])

      // Fetch purchase requests
      const { data: purchases } = await supabase.from("purchase_requests").select("*")

      // Fetch products for low stock analysis
      const { data: products } = await supabase.from("products").select("*")

      // Fetch admin settings for low stock threshold
      const { data: settings } = await supabase
        .from("admin_settings")
        .select("*")
        .eq("setting_key", "low_stock_threshold")

      const lowStockThreshold = settings?.[0]?.setting_value ? Number.parseInt(settings[0].setting_value) : 3

      // Calculate statistics
      const pendingOrders = purchases?.filter((p) => p.status === "pending").length || 0
      const completedOrders = purchases?.filter((p) => p.status === "completed").length || 0
      const cancelledOrders = purchases?.filter((p) => p.status === "cancelled").length || 0
      const lowStockProducts = products?.filter((p) => p.stock <= lowStockThreshold).length || 0

      const totalRevenue =
        purchases?.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.total_price, 0) || 0

      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyRevenue =
        purchases
          ?.filter((p) => {
            const purchaseDate = new Date(p.created_at)
            return (
              p.status === "completed" &&
              purchaseDate.getMonth() === currentMonth &&
              purchaseDate.getFullYear() === currentYear
            )
          })
          .reduce((sum, p) => sum + p.total_price, 0) || 0

      const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0

      // Calculate top selling products
      const productSales: { [key: string]: { name: string; sales: number; revenue: number } } = {}

      purchases
        ?.filter((p) => p.status === "completed")
        .forEach((purchase) => {
          purchase.items.forEach((item: any) => {
            if (!productSales[item.name]) {
              productSales[item.name] = { name: item.name, sales: 0, revenue: 0 }
            }
            productSales[item.name].sales += item.quantity
            productSales[item.name].revenue += item.total
          })
        })

      const topSellingProducts = Object.values(productSales)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)

      setStats({
        totalUsers: usersCount || 0,
        totalProducts: productsCount || 0,
        totalCategories: categoriesCount || 0,
        totalSubcategories: subcategoriesCount || 0,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        lowStockProducts,
        totalRevenue,
        monthlyRevenue,
        averageOrderValue,
        topSellingProducts,
      })

      // Fetch wallet statistics
      const walletData = await getWalletStats()
      setWalletStats(walletData)
    } catch (error) {
      console.error("Error fetching statistics:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="bg-slate-800/50 border-green-500/20">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-slate-700 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats || !walletStats) {
    return (
      <Card className="bg-slate-800/50 border-red-500/20">
        <CardContent className="p-6 text-center">
          <p className="text-red-400">Failed to load statistics</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Products</p>
                <p className="text-2xl font-bold text-white">{stats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Pending Orders</p>
                <p className="text-2xl font-bold text-white">{stats.pendingOrders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Low Stock Items</p>
                <p className="text-2xl font-bold text-white">{stats.lowStockProducts}</p>
              </div>
              <Package className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-green-400">{formatPrice(stats.totalRevenue)}</p>
              </div>
              <div className="flex items-center text-green-400">
                <TrendingUp className="h-4 w-4 mr-1" />
                <Euro className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Monthly Revenue</p>
                <p className="text-2xl font-bold text-blue-400">{formatPrice(stats.monthlyRevenue)}</p>
              </div>
              <div className="flex items-center text-blue-400">
                <Calendar className="h-4 w-4 mr-1" />
                <Euro className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Wallet Balance</p>
                <p
                  className={`text-2xl font-bold ${walletStats.totalBalance >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {formatPrice(walletStats.totalBalance)}
                </p>
              </div>
              <div className={`flex items-center ${walletStats.totalBalance >= 0 ? "text-green-400" : "text-red-400"}`}>
                {walletStats.totalBalance >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                <Euro className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Avg. Order Value</p>
                <p className="text-2xl font-bold text-purple-400">{formatPrice(stats.averageOrderValue)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-green-400">Order Status Overview</CardTitle>
            <CardDescription>Current status of all orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Completed</span>
                </div>
                <Badge className="bg-green-500/20 text-green-400">{stats.completedOrders}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-300">Pending</span>
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-400">{stats.pendingOrders}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-300">Cancelled</span>
                </div>
                <Badge className="bg-red-500/20 text-red-400">{stats.cancelledOrders}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-green-400">Top Selling Products</CardTitle>
            <CardDescription>Best performing products by sales volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topSellingProducts.length > 0 ? (
                stats.topSellingProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-sm text-gray-400">{product.sales} sold</p>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400">{formatPrice(product.revenue)}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center">No sales data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Overview */}
      <Card className="bg-slate-800/50 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400">Wallet Overview</CardTitle>
          <CardDescription>Financial summary and transaction overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-400">Total Income</p>
              <p className="text-xl font-bold text-green-400">{formatPrice(walletStats.totalIncome)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Total Expenses</p>
              <p className="text-xl font-bold text-red-400">{formatPrice(walletStats.totalExpenses)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Monthly Income</p>
              <p className="text-xl font-bold text-blue-400">{formatPrice(walletStats.monthlyIncome)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Monthly Expenses</p>
              <p className="text-xl font-bold text-orange-400">{formatPrice(walletStats.monthlyExpenses)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Store Overview */}
      <Card className="bg-slate-800/50 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400">Store Overview</CardTitle>
          <CardDescription>General store statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalCategories}</p>
              <p className="text-sm text-gray-400">Categories</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalSubcategories}</p>
              <p className="text-sm text-gray-400">Subcategories</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{walletStats.transactionCount}</p>
              <p className="text-sm text-gray-400">Transactions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              <p className="text-sm text-gray-400">Registered Users</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
