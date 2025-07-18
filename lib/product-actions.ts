import { supabase } from "./supabase"

interface ActionContext {
  user_email: string
  admin_email?: string
  product_name: string
  purchase_id: string
}

export class ProductActionsExecutor {
  private discordBotToken = ""
  private discordGuildId = ""
  private discordEnabled = false

  constructor() {
    this.loadDiscordSettings()
  }

  private async loadDiscordSettings() {
    const { data } = await supabase
      .from("admin_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["discord_bot_token", "discord_guild_id", "discord_bot_enabled"])

    if (data) {
      data.forEach((setting) => {
        switch (setting.setting_key) {
          case "discord_bot_token":
            this.discordBotToken = setting.setting_value
            break
          case "discord_guild_id":
            this.discordGuildId = setting.setting_value
            break
          case "discord_bot_enabled":
            this.discordEnabled = setting.setting_value === "true"
            break
        }
      })
    }
  }

  async executeActions(actions: string, event: string, context: ActionContext) {
    if (!actions) return

    const lines = actions
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line)
    let currentEvent = ""
    let isInTargetEvent = false

    for (const line of lines) {
      if (line.startsWith("@")) {
        currentEvent = line
        isInTargetEvent = currentEvent === `@${event}`
        continue
      }

      if (!isInTargetEvent) continue

      await this.executeLine(line, context)
    }
  }

  private async executeLine(line: string, context: ActionContext) {
    try {
      // Stock modification: product-slug.Stock() = -4
      if (line.includes(".Stock()")) {
        await this.executeStockAction(line, context)
      }
      // Discord message: discord-bot.sendmessage.channel = message
      else if (line.startsWith("discord-bot.sendmessage.")) {
        await this.executeDiscordAction(line, context)
      }
    } catch (error) {
      console.error("Error executing action line:", line, error)
    }
  }

  private async executeStockAction(line: string, context: ActionContext) {
    const match = line.match(/^(.+)\.Stock$$$$\s*=\s*([+-]?\d+)$/)
    if (!match) return

    const [, productSlug, stockChangeStr] = match
    const stockChange = Number.parseInt(stockChangeStr)

    // Find product by slug (we'll need to add slug to products or use name)
    const { data: product } = await supabase
      .from("products")
      .select("id, stock, name")
      .ilike("name", `%${productSlug.replace(/-/g, " ")}%`)
      .single()

    if (product) {
      const newStock = Math.max(0, product.stock + stockChange)
      await supabase.from("products").update({ stock: newStock }).eq("id", product.id)

      console.log(`Stock updated for ${product.name}: ${product.stock} -> ${newStock}`)
    }
  }

  private async executeDiscordAction(line: string, context: ActionContext) {
    if (!this.discordEnabled || !this.discordBotToken) return

    const match = line.match(/^discord-bot\.sendmessage\.(.+?)\s*=\s*(.+)$/)
    if (!match) return

    const [, channelName, messageTemplate] = match

    // Replace variables in message
    const message = messageTemplate
      .replace(/\{User\}/g, context.user_email)
      .replace(/\{Admin-User\}/g, context.admin_email || "Admin")
      .replace(/\{Product\}/g, context.product_name)
      .replace(/\{Purchase-ID\}/g, context.purchase_id)
      .replace(/@Admin/g, "@everyone") // or specific role mention

    // Send to Discord (this would need actual Discord API integration)
    await this.sendDiscordMessage(channelName, message)
  }

  private async sendDiscordMessage(channelName: string, message: string) {
    if (!this.discordBotToken) return

    try {
      // Get channel ID from settings or find by name
      const { data: channelSetting } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", `discord_${channelName}_channel`)
        .single()

      const channelId = channelSetting?.setting_value

      if (channelId) {
        // Send message via Discord API
        const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bot ${this.discordBotToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: message }),
        })

        if (!response.ok) {
          console.error("Failed to send Discord message:", await response.text())
        }
      }
    } catch (error) {
      console.error("Discord API error:", error)
    }
  }
}

export const productActionsExecutor = new ProductActionsExecutor()
