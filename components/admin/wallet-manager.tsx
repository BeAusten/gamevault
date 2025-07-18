"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getWalletTransactions,
  getWalletStats,
  addWalletTransaction,
  type WalletTransaction,
  type WalletStats,
} from "@/lib/wallet"
import { supabase } from "@/lib/supabase"
import { Plus, Minus, TrendingUp, TrendingDown, Euro, Calendar, User, FileText, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export function WalletManager() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [stats, setStats] = useState<WalletStats | null>(null)
  const [users, setUsers] = useState<Array<{ email: string }>>([])
  const [loading, setLoading] = useState(true)
  const [isAddingTransaction, setIsAddingTransaction] = useState(false)

  // Form states
  const [newTransaction, setNewTransaction] = useState({
    userEmail: "",
    amount: "",
    type: "manual_add" as "manual_add" | "manual_subtract",
    description: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [transactionsData, statsData, usersData] = await Promise.all([
        getWalletTransactions(),
        getWalletStats(),
        supabase.from("users").select("email").order("email"),
      ])

      setTransactions(transactionsData)
      setStats(statsData)
      setUsers(usersData.data || [])
    } catch (error) {
      console.error("Error fetching wallet data:", error)
      toast.error("Failed to load wallet data")
    } finally {
      setLoading(false)
    }
  }

  const handleAddTransaction = async () => {
    if (!newTransaction.userEmail || !newTransaction.amount || !newTransaction.description) {
      toast.error("Please fill in all fields")
      return
    }

    const amount = Number.parseFloat(newTransaction.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    try {
      setIsAddingTransaction(true)
      await addWalletTransaction(newTransaction.userEmail, amount, newTransaction.type, newTransaction.description)

      toast.success("Transaction added successfully!")
      setNewTransaction({
        userEmail: "",
        amount: "",
        type: "manual_add",
        description: "",
      })

      await fetchData()
    } catch (error) {
      console.error("Error adding transaction:", error)
      toast.error("Failed to add transaction")
    } finally {
      setIsAddingTransaction(false)
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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "income":
      case "manual_add":
        return <TrendingUp className="h-4 w-4 text-green-400" />
      case "expense":
      case "manual_subtract":
        return <TrendingDown className="h-4 w-4 text-red-400" />
      default:
        return <Euro className="h-4 w-4 text-gray-400" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "income":
      case "manual_add":
        return "text-green-400"
      case "expense":
      case "manual_subtract":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getTransactionBadgeColor = (type: string) => {
    switch (type) {
      case "income":
        return "bg-green-500/20 text-green-400"
      case "expense":
        return "bg-red-500/20 text-red-400"
      case "manual_add":
        return "bg-blue-500/20 text-blue-400"
      case "manual_subtract":
        return "bg-orange-500/20 text-orange-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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

  return (
    <div className="space-y-6">
      {/* Wallet Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Balance</p>
                  <p className={`text-2xl font-bold ${stats.totalBalance >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {formatPrice(stats.totalBalance)}
                  </p>
                </div>
                <div className={`flex items-center ${stats.totalBalance >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {stats.totalBalance >= 0 ? <TrendingUp className="h-8 w-8" /> : <TrendingDown className="h-8 w-8" />}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Income</p>
                  <p className="text-2xl font-bold text-green-400">{formatPrice(stats.totalIncome)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-400">{formatPrice(stats.totalExpenses)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Monthly Income</p>
                  <p className="text-2xl font-bold text-blue-400">{formatPrice(stats.monthlyIncome)}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Transaction */}
      <Card className="bg-slate-800/50 border-green-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-green-400">Wallet Management</CardTitle>
              <CardDescription>Add manual transactions and view wallet history</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                className="border-blue-500/50 text-blue-400 bg-transparent"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-green-500/30">
                  <DialogHeader>
                    <DialogTitle className="text-green-400">Add Manual Transaction</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="user-email">User Email</Label>
                      <Select
                        value={newTransaction.userEmail}
                        onValueChange={(value) => setNewTransaction({ ...newTransaction, userEmail: value })}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600">
                          <SelectValue placeholder="Select user email" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.email} value={user.email}>
                              {user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="transaction-type">Transaction Type</Label>
                      <Select
                        value={newTransaction.type}
                        onValueChange={(value: "manual_add" | "manual_subtract") =>
                          setNewTransaction({ ...newTransaction, type: value })
                        }
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual_add">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4 text-green-400" />
                              Add Money
                            </div>
                          </SelectItem>
                          <SelectItem value="manual_subtract">
                            <div className="flex items-center gap-2">
                              <Minus className="h-4 w-4 text-red-400" />
                              Subtract Money
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="amount">Amount (€)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={newTransaction.amount}
                        onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newTransaction.description}
                        onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                        placeholder="Reason for this transaction..."
                      />
                    </div>

                    <Button
                      onClick={handleAddTransaction}
                      disabled={isAddingTransaction}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isAddingTransaction ? "Adding..." : "Add Transaction"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <Card key={transaction.id} className="bg-slate-700/50 border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.transaction_type)}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white">{transaction.description}</p>
                              <Badge className={getTransactionBadgeColor(transaction.transaction_type)}>
                                {transaction.transaction_type.replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {transaction.user_email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(transaction.created_at)}
                              </div>
                              {transaction.purchase_id && (
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {transaction.purchase_id}
                                </div>
                              )}
                            </div>
                            {transaction.items && transaction.items.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500">Items:</p>
                                <div className="text-xs text-gray-400">
                                  {transaction.items.map((item: any, index: number) => (
                                    <span key={index}>
                                      {item.name} x{item.quantity}
                                      {index < transaction.items.length - 1 ? ", " : ""}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${getTransactionColor(transaction.transaction_type)}`}>
                            {transaction.amount >= 0 ? "+" : ""}
                            {formatPrice(transaction.amount)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No transactions found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
