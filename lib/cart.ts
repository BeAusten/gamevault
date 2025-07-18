import { supabase } from "./supabase"

export type CartItem = {
  id: number
  user_id: number
  product_id: number
  quantity: number
  created_at: string
  product: {
    id: number
    name: string
    price: number
    image_url: string
    stock: number
  }
}

export async function addToCart(userId: number, productId: number, quantity = 1) {
  try {
    // Check if item already exists in cart
    const { data: existing } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .single()

    if (existing) {
      // Update quantity
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id)

      if (error) throw error
    } else {
      // Add new item
      const { error } = await supabase.from("cart_items").insert([{ user_id: userId, product_id: productId, quantity }])

      if (error) throw error
    }
  } catch (error) {
    console.error("Add to cart error:", error)
    throw error
  }
}

export async function getCartItems(userId: number): Promise<CartItem[]> {
  try {
    // First get cart items
    const { data: cartItems, error: cartError } = await supabase.from("cart_items").select("*").eq("user_id", userId)

    if (cartError) {
      console.error("Get cart items error:", cartError)
      throw cartError
    }

    if (!cartItems || cartItems.length === 0) {
      return []
    }

    // Get product IDs from cart items
    const productIds = cartItems.map((item) => item.product_id)

    // Get products separately
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, image_url, stock")
      .in("id", productIds)

    if (productsError) {
      console.error("Get products error:", productsError)
      throw productsError
    }

    // Combine cart items with product data
    const result: CartItem[] = cartItems.map((cartItem) => {
      const product = products?.find((p) => p.id === cartItem.product_id)
      return {
        ...cartItem,
        product: product || {
          id: cartItem.product_id,
          name: "Unknown Product",
          price: 0,
          image_url: "",
          stock: 0,
        },
      }
    })

    return result
  } catch (error) {
    console.error("Get cart items error:", error)
    throw error
  }
}

export async function updateCartItemQuantity(cartItemId: number, quantity: number) {
  if (quantity <= 0) {
    return removeFromCart(cartItemId)
  }

  const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", cartItemId)

  if (error) throw error
}

export async function removeFromCart(cartItemId: number) {
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId)

  if (error) throw error
}

export async function clearCart(userId: number) {
  const { error } = await supabase.from("cart_items").delete().eq("user_id", userId)

  if (error) throw error
}
