import { supabase } from "./supabase"
import bcrypt from "bcryptjs"

export type User = {
  id: number
  email: string
  is_admin: boolean
  created_at: string
}

export async function signUp(email: string, password: string) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const { data, error } = await supabase
      .from("users")
      .insert([{ email, password_hash: hashedPassword }])
      .select()
      .single()

    if (error) {
      console.error("Signup error:", error)
      throw new Error(error.message)
    }

    return data
  } catch (error) {
    console.error("Signup error:", error)
    throw error
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error || !user) {
      console.error("User not found:", error)
      throw new Error("Invalid credentials")
    }

    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      throw new Error("Invalid credentials")
    }

    return {
      id: user.id,
      email: user.email,
      is_admin: user.is_admin,
      created_at: user.created_at,
    }
  } catch (error) {
    console.error("SignIn error:", error)
    throw error
  }
}

export async function makeUserAdmin(userId: number) {
  const { error } = await supabase.from("users").update({ is_admin: true }).eq("id", userId)

  if (error) throw error
}
