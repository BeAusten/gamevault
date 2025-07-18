"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Percent } from "lucide-react"

interface DiscountInputProps {
  discountCode: string
  setDiscountCode: (code: string) => void
  appliedDiscount: {
    code: string
    type: "percentage" | "fixed"
    value: number
    discount_amount: number
  } | null
  onApplyDiscount: () => void
  onRemoveDiscount: () => void
}

export function DiscountInput({
  discountCode,
  setDiscountCode,
  appliedDiscount,
  onApplyDiscount,
  onRemoveDiscount,
}: DiscountInputProps) {
  if (appliedDiscount) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-green-400" />
          <span className="text-green-400 font-semibold">{appliedDiscount.code}</span>
          <Badge className="bg-green-500/20 text-green-400">
            {appliedDiscount.type === "percentage" ? `${appliedDiscount.value}% OFF` : `€${appliedDiscount.value} OFF`}
          </Badge>
        </div>
        <Button size="sm" variant="ghost" onClick={onRemoveDiscount} className="text-green-400 hover:text-green-300">
          <X className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Enter discount code"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
          className="bg-slate-700 border-slate-600"
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              onApplyDiscount()
            }
          }}
        />
        <Button
          onClick={onApplyDiscount}
          disabled={!discountCode.trim()}
          variant="outline"
          className="border-green-500/50 text-green-400 hover:bg-green-500/10 bg-transparent"
        >
          Apply
        </Button>
      </div>
    </div>
  )
}
