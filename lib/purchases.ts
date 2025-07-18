import { supabase } from "./supabase"
import type { CartItem } from "./cart"

export type PurchaseRequest = {
  id: number
  user_id: number
  items: any[]
  total_price: number
  status: string
  purchase_id: string
  discord_notified: boolean
  created_at: string
  user: {
    email: string
  }
}

export async function createPurchaseRequest(userId: number, cartItems: CartItem[]) {
  try {
    const purchaseId = `PUR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const items = cartItems.map((item) => ({
      product_id: item.product_id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      total: item.product.price * item.quantity,
    }))

    const totalPrice = items.reduce((sum, item) => sum + item.total, 0)

    // Create purchase request
    const { data, error } = await supabase
      .from("purchase_requests")
      .insert([
        {
          user_id: userId,
          items,
          total_price: totalPrice,
          purchase_id: purchaseId,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Purchase request creation error:", error)
      throw error
    }

    // Update stock for each item (reduce stock by quantity purchased)
    for (const item of items) {
      // Get current stock first
      const { data: product, error: stockError } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single()

      if (stockError) {
        console.error("Error getting product stock:", stockError)
        continue
      }

      // Calculate new stock
      const newStock = Math.max(0, product.stock - item.quantity)

      // Update stock
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", item.product_id)

      if (updateError) {
        console.error("Error updating product stock:", updateError)
      }
    }

    // Create notification for admins
    await supabase.from("notifications").insert([
      {
        type: "new_purchase",
        title: "New Purchase Request",
        message: `New purchase request ${purchaseId} for €${totalPrice.toFixed(2)} from user ID ${userId}`,
      },
    ])

    return data
  } catch (error) {
    console.error("Create purchase request error:", error)
    throw error
  }
}

export async function getPurchaseRequests(): Promise<PurchaseRequest[]> {
  try {
    // Get purchase requests first
    const { data: requests, error: requestsError } = await supabase
      .from("purchase_requests")
      .select("*")
      .order("created_at", { ascending: false })

    if (requestsError) {
      console.error("Get purchase requests error:", requestsError)
      throw requestsError
    }

    if (!requests || requests.length === 0) {
      return []
    }

    // Get user emails for each request
    const userIds = [...new Set(requests.map((req) => req.user_id))]
    const { data: users, error: usersError } = await supabase.from("users").select("id, email").in("id", userIds)

    if (usersError) {
      console.error("Get users error:", usersError)
      throw usersError
    }

    // Combine requests with user data
    const result: PurchaseRequest[] = requests.map((request) => {
      const user = users?.find((u) => u.id === request.user_id)
      return {
        ...request,
        user: {
          email: user?.email || "Unknown User",
        },
      }
    })

    return result
  } catch (error) {
    console.error("Get purchase requests error:", error)
    throw error
  }
}

export async function completePurchase(purchaseId: number) {
  try {
    const { error } = await supabase.from("purchase_requests").update({ status: "completed" }).eq("id", purchaseId)

    if (error) {
      console.error("Complete purchase error:", error)
      throw error
    }

    // Create completion notification
    await supabase.from("notifications").insert([
      {
        type: "purchase_completed",
        title: "Purchase Completed",
        message: `Purchase request ID ${purchaseId} has been marked as completed`,
      },
    ])
  } catch (error) {
    console.error("Complete purchase error:", error)
    throw error
  }
}

export async function cancelPurchase(purchaseId: number) {
  try {
    // Get purchase details to restore stock
    const { data: purchase, error: fetchError } = await supabase
      .from("purchase_requests")
      .select("*")
      .eq("id", purchaseId)
      .single()

    if (fetchError) {
      console.error("Fetch purchase error:", fetchError)
      throw fetchError
    }

    // Restore stock for each item
    for (const item of purchase.items) {
      // Get current stock
      const { data: product, error: stockError } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single()

      if (stockError) {
        console.error("Error getting product stock:", stockError)
        continue
      }

      // Restore stock
      const newStock = product.stock + item.quantity

      const { error: updateError } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", item.product_id)

      if (updateError) {
        console.error("Error restoring product stock:", updateError)
      }
    }

    // Update status
    const { error } = await supabase.from("purchase_requests").update({ status: "cancelled" }).eq("id", purchaseId)

    if (error) {
      console.error("Cancel purchase error:", error)
      throw error
    }
  } catch (error) {
    console.error("Cancel purchase error:", error)
    throw error
  }
}
