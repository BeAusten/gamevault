import { supabase } from "./supabase"

export type Notification = {
  id: number
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function markNotificationAsRead(notificationId: number) {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

  if (error) throw error
}

export async function markAllNotificationsAsRead() {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("is_read", false)

  if (error) throw error
}
