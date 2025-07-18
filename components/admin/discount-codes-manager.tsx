"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Percent, Calendar, Users } from "lucide-react"

type DiscountCode = {
  id: number
  code: string
  discount_type: "percentage" | "fixed"
  discount_value: number
  min_purchase_amount: number
  max_uses: number | null
  current_uses: number
  valid_from: string
  valid_until: string | null
  applicable_products: string
  is_active: boolean
  created_at: string
}

type Product = {
  id: number
  name: string
  price: number
}

interface DiscountCodesManagerProps {
  products: Product[]
}

export function DiscountCodesManager({ products }: DiscountCodesManagerProps) {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null)
  const [loading, setLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    min_purchase_amount: "",
    max_uses: "",
    valid_until: "",
    applicable_products: "all",
    selected_products: [] as number[],
    is_active: true,
  })

  useEffect(() => {
    fetchDiscountCodes()
  }, [])

  const fetchDiscountCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setDiscountCodes(data || [])
    } catch (error) {
      console.error("Error fetching discount codes:", error)
      toast.error("Failed to load discount codes")
    }
  }

  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: "",
      min_purchase_amount: "",
      max_uses: "",
      valid_until: "",
      applicable_products: "all",
      selected_products: [],
      is_active: true,
    })
    setEditingCode(null)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      if (!formData.code || !formData.discount_value) {
        toast.error("Code and discount value are required")
        return
      }

      const applicableProducts =
        formData.applicable_products === "all" ? "all" : JSON.stringify(formData.selected_products)

      const discountData = {
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: Number.parseFloat(formData.discount_value),
        min_purchase_amount: Number.parseFloat(formData.min_purchase_amount) || 0,
        max_uses: formData.max_uses ? Number.parseInt(formData.max_uses) : null,
        valid_until: formData.valid_until || null,
        applicable_products: applicableProducts,
        is_active: formData.is_active,
      }

      let error
      if (editingCode) {
        const { error: updateError } = await supabase
          .from("discount_codes")
          .update(discountData)
          .eq("id", editingCode.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase.from("discount_codes").insert([discountData])
        error = insertError
      }

      if (error) throw error

      toast.success(editingCode ? "Discount code updated!" : "Discount code created!")
      setIsDialogOpen(false)
      resetForm()
      fetchDiscountCodes()
    } catch (error: any) {
      console.error("Error saving discount code:", error)
      if (error.code === "23505") {
        toast.error("Discount code already exists")
      } else {
        toast.error("Failed to save discount code")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (code: DiscountCode) => {
    setEditingCode(code)
    const selectedProducts = code.applicable_products === "all" ? [] : JSON.parse(code.applicable_products)

    setFormData({
      code: code.code,
      discount_type: code.discount_type,
      discount_value: code.discount_value.toString(),
      min_purchase_amount: code.min_purchase_amount.toString(),
      max_uses: code.max_uses?.toString() || "",
      valid_until: code.valid_until ? code.valid_until.split("T")[0] : "",
      applicable_products: code.applicable_products === "all" ? "all" : "specific",
      selected_products: selectedProducts,
      is_active: code.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from("discount_codes").delete().eq("id", id)

      if (error) throw error

      toast.success("Discount code deleted!")
      fetchDiscountCodes()
    } catch (error) {
      console.error("Error deleting discount code:", error)
      toast.error("Failed to delete discount code")
    }
  }

  const toggleActive = async (id: number, isActive: boolean) => {
    try {
      const { error } = await supabase.from("discount_codes").update({ is_active: !isActive }).eq("id", id)

      if (error) throw error

      toast.success(`Discount code ${!isActive ? "activated" : "deactivated"}!`)
      fetchDiscountCodes()
    } catch (error) {
      console.error("Error toggling discount code:", error)
      toast.error("Failed to update discount code")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false
    return new Date(validUntil) < new Date()
  }

  const isMaxUsesReached = (maxUses: number | null, currentUses: number) => {
    if (!maxUses) return false
    return currentUses >= maxUses
  }

  return (
    <Card className="bg-slate-800/50 border-green-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Discount Codes
            </CardTitle>
            <CardDescription>Create and manage discount codes for your store</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-slate-900 border-green-500/30 max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-green-400">
                  {editingCode ? "Edit Discount Code" : "Create Discount Code"}
                </DialogTitle>
              </DialogHeader>

              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="code">Discount Code</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="SAVE20"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="discount_type">Discount Type</Label>
                      <Select
                        value={formData.discount_type}
                        onValueChange={(value: "percentage" | "fixed") =>
                          setFormData({ ...formData, discount_type: value })
                        }
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discount_value">
                        Discount Value {formData.discount_type === "percentage" ? "(%)" : "(€)"}
                      </Label>
                      <Input
                        id="discount_value"
                        type="number"
                        step="0.01"
                        value={formData.discount_value}
                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                        placeholder={formData.discount_type === "percentage" ? "20" : "5.00"}
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="min_purchase">Minimum Purchase (€)</Label>
                      <Input
                        id="min_purchase"
                        type="number"
                        step="0.01"
                        value={formData.min_purchase_amount}
                        onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                        placeholder="0.00"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="max_uses">Max Uses (optional)</Label>
                      <Input
                        id="max_uses"
                        type="number"
                        value={formData.max_uses}
                        onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                        placeholder="Unlimited"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="valid_until">Valid Until (optional)</Label>
                      <Input
                        id="valid_until"
                        type="date"
                        value={formData.valid_until}
                        onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Applicable Products</Label>
                    <Select
                      value={formData.applicable_products}
                      onValueChange={(value) => setFormData({ ...formData, applicable_products: value })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        <SelectItem value="specific">Specific Products</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.applicable_products === "specific" && (
                    <div>
                      <Label>Select Products</Label>
                      <div className="max-h-40 overflow-y-auto border border-slate-600 rounded-md p-2 bg-slate-700">
                        {products.map((product) => (
                          <div key={product.id} className="flex items-center space-x-2 py-1">
                            <input
                              type="checkbox"
                              id={`product-${product.id}`}
                              checked={formData.selected_products.includes(product.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    selected_products: [...formData.selected_products, product.id],
                                  })
                                } else {
                                  setFormData({
                                    ...formData,
                                    selected_products: formData.selected_products.filter((id) => id !== product.id),
                                  })
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={`product-${product.id}`} className="text-sm text-white cursor-pointer">
                              {product.name} - €{product.price}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>

                  <Button onClick={handleSubmit} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                    {loading ? "Saving..." : editingCode ? "Update Code" : "Create Code"}
                  </Button>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {discountCodes.length === 0 ? (
            <div className="text-center py-8">
              <Percent className="w-16 h-16 mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400">No discount codes created yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {discountCodes.map((code) => (
                <div key={code.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold text-blue-400">{code.code}</span>
                      <Badge
                        className={code.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
                      >
                        {code.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {isExpired(code.valid_until) && (
                        <Badge className="bg-orange-500/20 text-orange-400">
                          <Calendar className="w-3 h-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                      {isMaxUsesReached(code.max_uses, code.current_uses) && (
                        <Badge className="bg-red-500/20 text-red-400">
                          <Users className="w-3 h-3 mr-1" />
                          Max Uses Reached
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(code)}>
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={code.is_active ? "destructive" : "default"}
                        onClick={() => toggleActive(code.id, code.is_active)}
                      >
                        {code.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(code.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Discount:</span>
                      <p className="text-white font-semibold">
                        {code.discount_type === "percentage" ? `${code.discount_value}%` : `€${code.discount_value}`}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Min Purchase:</span>
                      <p className="text-white font-semibold">€{code.min_purchase_amount}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Uses:</span>
                      <p className="text-white font-semibold">
                        {code.current_uses}
                        {code.max_uses ? `/${code.max_uses}` : " (unlimited)"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Valid Until:</span>
                      <p className="text-white font-semibold">
                        {code.valid_until ? formatDate(code.valid_until) : "No expiry"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2">
                    <span className="text-gray-400 text-sm">Products:</span>
                    <p className="text-white text-sm">
                      {code.applicable_products === "all" ? "All Products" : "Specific Products"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
