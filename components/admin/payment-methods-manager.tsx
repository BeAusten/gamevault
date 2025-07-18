"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"

type PaymentMethod = {
  id: string
  name: string
  type: string
  enabled: boolean
}

const initialPaymentMethods: PaymentMethod[] = [
  { id: "1", name: "Credit Card", type: "card", enabled: true },
  { id: "2", name: "PayPal", type: "paypal", enabled: false },
]

interface PaymentMethodsManagerProps {
  paymentMethods: { [key: string]: boolean }
  onUpdate: (methods: { [key: string]: boolean }) => void
}

export function PaymentMethodsManager({ paymentMethods, onUpdate }: PaymentMethodsManagerProps) {
  const [open, setOpen] = useState(false)
  const [newPaymentMethodName, setNewPaymentMethodName] = useState("")
  const [newPaymentMethodType, setNewPaymentMethodType] = useState("")

  const defaultMethods = [
    { key: "paypal", name: "PayPal", description: "Accept payments via PayPal" },
    { key: "crypto", name: "Cryptocurrency", description: "Accept Bitcoin, Ethereum, and other cryptocurrencies" },
    { key: "gift_cards", name: "Gift Cards", description: "Accept various gift cards as payment" },
    { key: "bank_transfer", name: "Bank Transfer", description: "Accept direct bank transfers" },
    { key: "cash_app", name: "Cash App", description: "Accept payments via Cash App" },
  ]

  const togglePaymentMethod = (key: string) => {
    const updatedMethods = { ...paymentMethods, [key]: !paymentMethods[key] }
    onUpdate(updatedMethods)
  }

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="border-green-500/50 text-green-400 hover:bg-green-500/10">
            Payment Methods
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-slate-900 border-green-500/30 overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-green-400">Manage Payment Methods</DialogTitle>
            <DialogDescription>Enable or disable payment methods shown to customers.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <div className="space-y-4 p-4">
              {defaultMethods.map((method) => (
                <div key={method.key} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-white">{method.name}</h3>
                    <p className="text-sm text-gray-400">{method.description}</p>
                  </div>
                  <Button
                    variant={paymentMethods[method.key] ? "default" : "outline"}
                    onClick={() => togglePaymentMethod(method.key)}
                    className={
                      paymentMethods[method.key] ? "bg-green-600 hover:bg-green-700" : "border-gray-500 text-gray-400"
                    }
                  >
                    {paymentMethods[method.key] ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-slate-700">
            <p className="text-sm text-gray-400">
              These settings control which payment methods are displayed in the user guide.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
