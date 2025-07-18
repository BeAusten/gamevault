"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Code, Save, Info } from "lucide-react"
import { toast } from "sonner"

interface ProductActionsEditorProps {
  productId: number
  currentActions: string
  onSave: (actions: string) => void
}

export function ProductActionsEditor({ productId, currentActions, onSave }: ProductActionsEditorProps) {
  const [actions, setActions] = useState(currentActions)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSave = () => {
    onSave(actions)
    setIsDialogOpen(false)
    toast.success("Product actions saved!")
  }

  const exampleActions = `@purchase_completed
PROD-${productId}-ABCDEF.Stock() = -1
discord-bot.sendmessage.general = {User} purchased {Product}! Purchase ID: {Purchase-ID}

@purchase_cancelled
PROD-${productId}-ABCDEF.Stock() = +1
discord-bot.sendmessage.admin = Purchase {Purchase-ID} was cancelled, stock restored

@low_stock
discord-bot.sendmessage.admin = @Admin Low stock alert for {Product}! Only {Stock} left`

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-blue-500/50 text-blue-400 bg-transparent">
          <Code className="w-3 h-3 mr-1" />
          Actions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900 border-blue-500/30 overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-blue-400">Product Actions Editor</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-blue-400">Action Syntax Guide</span>
              </div>
              <div className="space-y-2 text-sm text-gray-300">
                <p>
                  <Badge variant="secondary">@event_name</Badge> - Define when actions should trigger
                </p>
                <p>
                  <Badge variant="secondary">PROD-ID-CODE.Stock() = +/-number</Badge> - Modify product stock
                </p>
                <p>
                  <Badge variant="secondary">discord-bot.sendmessage.channel = message</Badge> - Send Discord message
                </p>
                <p>
                  <strong>Variables:</strong> {"{User}"}, {"{Admin-User}"}, {"{Product}"}, {"{Purchase-ID}"},{" "}
                  {"{Stock}"}
                </p>
                <p>
                  <strong>Events:</strong> @purchase_completed, @purchase_cancelled, @low_stock, @stock_updated
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Product Actions</label>
              <Textarea
                value={actions}
                onChange={(e) => setActions(e.target.value)}
                placeholder={exampleActions}
                className="bg-slate-700 border-slate-600 font-mono text-sm min-h-[300px]"
              />
            </div>

            <div className="p-4 bg-slate-800/50 border border-slate-600 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Example Actions:</h4>
              <pre className="text-xs text-gray-300 whitespace-pre-wrap">{exampleActions}</pre>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save Actions
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
