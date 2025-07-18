import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Category = {
  id: number
  name: string
  slug: string
  created_at: string
}

export type Subcategory = {
  id: number
  category_id: number
  name: string
  slug: string
  created_at: string
}

export type Product = {
  id: number
  subcategory_id: number
  name: string
  description: string
  price: number
  image_url: string
  specifications: Record<string, any>
  stock: number
  created_at: string
}

export type User = {
  id: number
  email: string
  is_admin: boolean
  created_at: string
}

export type CartItemDB = {
  id: number
  user_id: number
  product_id: number
  quantity: number
  created_at: string
}
