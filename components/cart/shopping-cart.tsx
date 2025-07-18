"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { getCartItems, removeFromCart, updateCartItemQuantity, clearCart, type CartItem } from "@/lib/cart"
import { createPurchaseRequest } from "@/lib/purchases"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, Trash2, ShoppingCartIcon, ExternalLink, Copy } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { DiscountInput } from "./discount-input"

interface ShoppingCartProps {
  isOpen: boolean
  onClose: () => void
  onCartUpdate: () => void
  adminSettings: { [key: string]: string }
}

export function ShoppingCart({ isOpen, onClose, onCartUpdate, adminSettings }: ShoppingCartProps) {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [purchaseId, setPurchaseId] = useState<string | null>(null)
  const [discountCode, setDiscountCode] = useState("")
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string
    type: "percentage" | "fixed"
    value: number
    discount_amount: number
  } | null>(null)

  useEffect(() => {
    if (isOpen && user) {
      fetchCartItems()
    }
  }, [isOpen, user])

  const fetchCartItems = async () => {
    if (!user) return

    try {
      const items = await getCartItems(user.id)
      setCartItems(items)
    } catch (error) {
      console.error("Error fetching cart items:", error)
      toast.error("Failed to load cart items")
    }
  }

  const handleUpdateQuantity = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      await updateCartItemQuantity(cartItemId, newQuantity)
      fetchCartItems()
      onCartUpdate()
    } catch (error) {
      toast.error("Failed to update quantity")
    }
  }

  const handleRemoveItem = async (cartItemId: number) => {
    try {
      await removeFromCart(cartItemId)
      fetchCartItems()
      onCartUpdate()
      toast.success("Item removed from cart")
    } catch (error) {
      toast.error("Failed to remove item")
    }
  }

  const applyDiscountCode = async () => {
    if (!discountCode.trim()) return

    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", discountCode.toUpperCase())
        .eq("is_active", true)
        .single()

      if (error || !data) {
        toast.error("Invalid or expired discount code")
        return
      }

      // Check if code is expired
      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        toast.error("This discount code has expired")
        return
      }

      // Check if max uses reached
      if (data.max_uses && data.current_uses >= data.max_uses) {
        toast.error("This discount code has reached its usage limit")
        return
      }

      // Check minimum purchase amount
      const subtotal = calculateSubtotal()
      if (subtotal < data.min_purchase_amount) {
        toast.error(`Minimum purchase amount is €${data.min_purchase_amount}`)
        return
      }

      // Calculate discount
      let discountAmount = 0
      if (data.discount_type === "percentage") {
        discountAmount = (subtotal * data.discount_value) / 100
      } else {
        discountAmount = data.discount_value
      }

      // Don't allow discount to exceed total
      discountAmount = Math.min(discountAmount, subtotal)

      setAppliedDiscount({
        code: data.code,
        type: data.discount_type,
        value: data.discount_value,
        discount_amount: discountAmount,
      })

      toast.success(`Discount code applied! You saved €${discountAmount.toFixed(2)}`)
    } catch (error) {
      console.error("Error applying discount:", error)
      toast.error("Failed to apply discount code")
    }
  }

  const removeDiscountCode = () => {
    setAppliedDiscount(null)
    setDiscountCode("")
    toast.success("Discount code removed")
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = item.product.sale_active ? item.product.sale_price : item.product.price
      return sum + price * item.quantity
    }, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    if (appliedDiscount) {
      return Math.max(0, subtotal - appliedDiscount.discount_amount)
    }
    return subtotal
  }

  const handleCreatePurchaseRequest = async () => {
    if (!user || cartItems.length === 0) return

    setIsLoading(true)
    try {
      // Update discount code usage if applied
      if (appliedDiscount) {
        await supabase
          .from("discount_codes")
          .update({ current_uses: supabase.raw("current_uses + 1") })
          .eq("code", appliedDiscount.code)
      }

      const purchaseRequest = await createPurchaseRequest(user.id, cartItems, appliedDiscount)
      setPurchaseId(purchaseRequest.purchase_id)
      await clearCart(user.id)
      setCartItems([])
      setAppliedDiscount(null)
      setDiscountCode("")
      onCartUpdate()
      toast.success("Purchase request created successfully!")
    } catch (error) {
      toast.error("Failed to create purchase request")
      console.error("Purchase request error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyPurchaseId = () => {
    if (purchaseId) {
      navigator.clipboard.writeText(purchaseId)
      toast.success("Purchase ID copied to clipboard!")
    }
  }

  const getDiscordLink = () => {
    return adminSettings.discord_server_link || "https://discord.gg/yourserver"
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price)
  }

  if (purchaseId) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md bg-slate-900 border-green-500/30">
          <DialogHeader>
            <DialogTitle className="text-green-400">Purchase Request Created!</DialogTitle>
            <DialogDescription>Your purchase request has been created successfully.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCartIcon className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Order Confirmed!</h3>
              <p className="text-gray-400">Your purchase ID is:</p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg border border-green-500/20">
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg text-green-400">{purchaseId}</span>
                <Button size="sm" variant="outline" onClick={copyPurchaseId}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-2">Next Steps:</h4>
                <ol className="text-sm text-gray-300 space-y-1">
                  <li>1. Join our Discord server</li>
                  <li>2. Go to #purchase-requests channel</li>
                  <li>3. Send your Purchase ID</li>
                  <li>4. Complete payment via provided method</li>
                  <li>5. Receive your items within {adminSettings.delivery_time || "24 hours"}</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <a href={getDiscordLink()} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Join Discord
                  </a>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPurchaseId(null)
                    onClose()
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-slate-900 border-blue-500/30 overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-blue-400 flex items-center gap-2">
            <ShoppingCartIcon className="w-5 h-5" />
            Shopping Cart ({cartItems.length} items)
          </DialogTitle>
          <DialogDescription>Review your items and create a purchase request</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <ShoppingCartIcon className="w-16 h-16 text-gray-500 mb-4" />
              <p className="text-gray-400 text-lg">Your cart is empty</p>
              <p className="text-gray-500 text-sm">Add some items to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-3 pr-4">
                  {cartItems.map((item) => {
                    const price = item.product.sale_active ? item.product.sale_price : item.product.price
                    const totalPrice = price * item.quantity

                    return (
                      <Card key={item.id} className="bg-slate-800/50 border-slate-600">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="w-16 h-16 relative overflow-hidden rounded-lg flex-shrink-0">
                              <Image
                                src={item.product.image_url || "/placeholder.svg?height=64&width=64"}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-semibold text-white truncate">{item.product.name}</h4>
                                  <div className="flex items-center gap-2">
                                    {item.product.sale_active ? (
                                      <>
                                        <span className="text-gray-400 line-through text-sm">
                                          {formatPrice(item.product.price)}
                                        </span>
                                        <span className="text-green-400 font-semibold">
                                          {formatPrice(item.product.sale_price)}
                                        </span>
                                        <Badge className="bg-red-500/20 text-red-400 text-xs">
                                          -{item.product.sale_percentage}%
                                        </Badge>
                                      </>
                                    ) : (
                                      <span className="text-blue-400 font-semibold">{formatPrice(price)}</span>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                    className="w-8 h-8 p-0"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const newQuantity = Number.parseInt(e.target.value)
                                      if (newQuantity > 0 && newQuantity <= item.product.stock) {
                                        handleUpdateQuantity(item.id, newQuantity)
                                      }
                                    }}
                                    className="w-16 text-center bg-slate-700 border-slate-600"
                                    min="1"
                                    max={item.product.stock}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                    disabled={item.quantity >= item.product.stock}
                                    className="w-8 h-8 p-0"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                                <span className="font-semibold text-white">{formatPrice(totalPrice)}</span>
                              </div>

                              {item.quantity >= item.product.stock && (
                                <p className="text-orange-400 text-xs mt-1">Maximum stock reached</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>

              <Separator />

              {/* Discount Code Section */}
              <DiscountInput
                discountCode={discountCode}
                setDiscountCode={setDiscountCode}
                appliedDiscount={appliedDiscount}
                onApplyDiscount={applyDiscountCode}
                onRemoveDiscount={removeDiscountCode}
              />

              {/* Order Summary */}
              <div className="space-y-3">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal:</span>
                  <span>{formatPrice(calculateSubtotal())}</span>
                </div>

                {appliedDiscount && (
                  <div className="flex justify-between text-green-400">
                    <span>
                      Discount ({appliedDiscount.code}
                      {appliedDiscount.type === "percentage" ? ` -${appliedDiscount.value}%` : ""}):
                    </span>
                    <span>-{formatPrice(appliedDiscount.discount_amount)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-xl font-bold text-white">
                  <span>Total:</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>

                <Button
                  onClick={handleCreatePurchaseRequest}
                  disabled={isLoading || cartItems.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                >
                  {isLoading ? "Creating Request..." : "Create Purchase Request"}
                </Button>

                <p className="text-xs text-gray-400 text-center">
                  You'll receive a Purchase ID to complete payment via Discord
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
