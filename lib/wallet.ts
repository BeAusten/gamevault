import { supabase } from "./supabase"

export type WalletTransaction = {
  id: number
  user_email: string
  amount: number
  transaction_type: "income" | "expense" | "manual_add" | "manual_subtract"
  description: string
  purchase_id?: string
  items?: any[]
  created_at: string
}

export type WalletStats = {
  totalBalance: number
  totalIncome: number
  totalExpenses: number
  monthlyIncome: number
  monthlyExpenses: number
  transactionCount: number
}

export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  try {
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching wallet transactions:", error)
    throw error
  }
}

export async function getWalletStats(): Promise<WalletStats> {
  try {
    const { data, error } = await supabase.from("wallet_transactions").select("*")

    if (error) throw error

    const transactions = data || []
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const totalIncome = transactions
      .filter((t) => t.transaction_type === "income" || t.transaction_type === "manual_add")
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = Math.abs(
      transactions
        .filter((t) => t.transaction_type === "expense" || t.transaction_type === "manual_subtract")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    )

    const monthlyTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.created_at)
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear
    })

    const monthlyIncome = monthlyTransactions
      .filter((t) => t.transaction_type === "income" || t.transaction_type === "manual_add")
      .reduce((sum, t) => sum + t.amount, 0)

    const monthlyExpenses = Math.abs(
      monthlyTransactions
        .filter((t) => t.transaction_type === "expense" || t.transaction_type === "manual_subtract")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    )

    return {
      totalBalance: totalIncome - totalExpenses,
      totalIncome,
      totalExpenses,
      monthlyIncome,
      monthlyExpenses,
      transactionCount: transactions.length,
    }
  } catch (error) {
    console.error("Error fetching wallet stats:", error)
    throw error
  }
}

export async function addWalletTransaction(
  userEmail: string,
  amount: number,
  transactionType: "manual_add" | "manual_subtract",
  description: string,
): Promise<void> {
  try {
    const { error } = await supabase.from("wallet_transactions").insert([
      {
        user_email: userEmail,
        amount: transactionType === "manual_subtract" ? -Math.abs(amount) : Math.abs(amount),
        transaction_type: transactionType,
        description,
      },
    ])

    if (error) throw error
  } catch (error) {
    console.error("Error adding wallet transaction:", error)
    throw error
  }
}

export async function addPurchaseTransaction(
  userEmail: string,
  amount: number,
  purchaseId: string,
  items: any[],
): Promise<void> {
  try {
    const { error } = await supabase.from("wallet_transactions").insert([
      {
        user_email: userEmail,
        amount,
        transaction_type: "income",
        description: `Purchase completed - ${purchaseId}`,
        purchase_id: purchaseId,
        items,
      },
    ])

    if (error) throw error
  } catch (error) {
    console.error("Error adding purchase transaction:", error)
    throw error
  }
}
