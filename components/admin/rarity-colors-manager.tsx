"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash, Palette } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type RarityColors = Record<string, string | string[]>

interface RarityColorsManagerProps {
  rarityColors: RarityColors
  rarityOrder: string[]
  onUpdate: (colors: RarityColors, order: string[]) => void
}

export function RarityColorsManager({ rarityColors = {}, rarityOrder = [], onUpdate }: RarityColorsManagerProps) {
  const [newName, setNewName] = useState("")
  const [newColors, setNewColors] = useState(["#ffffff"])
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const orderedRarities = rarityOrder.filter((name) => name in rarityColors)
  const fullOrder = [...orderedRarities, ...Object.keys(rarityColors).filter((n) => !orderedRarities.includes(n))]

  const pushUpdate = (colors: RarityColors, order: string[]) => {
    onUpdate(colors, order)
  }

  const handleAddRarity = () => {
    const name = newName.trim()
    if (!name) {
      toast.error("Name is required")
      return
    }
    if (name in rarityColors) {
      toast.error("Rarity already exists")
      return
    }

    const colorValue = newColors.length === 1 ? newColors[0] : newColors
    const updatedColors = { ...rarityColors, [name]: colorValue }
    const updatedOrder = [...fullOrder, name]
    pushUpdate(updatedColors, updatedOrder)
    setNewName("")
    setNewColors(["#ffffff"])
    toast.success("Rarity added successfully!")
  }

  const handleRemoveRarity = (name: string) => {
    const { [name]: _, ...rest } = rarityColors
    const updatedOrder = fullOrder.filter((r) => r !== name)
    pushUpdate(rest, updatedOrder)
    toast.success("Rarity removed successfully!")
  }

  const handleColorChange = (colors: string[]) => {
    if (!selectedName) return
    const colorValue = colors.length === 1 ? colors[0] : colors
    pushUpdate({ ...rarityColors, [selectedName]: colorValue }, fullOrder)
  }

  const addColorToNew = () => {
    setNewColors([...newColors, "#ffffff"])
  }

  const removeColorFromNew = (index: number) => {
    if (newColors.length > 1) {
      setNewColors(newColors.filter((_, i) => i !== index))
    }
  }

  const updateNewColor = (index: number, color: string) => {
    const updated = [...newColors]
    updated[index] = color
    setNewColors(updated)
  }

  const getSelectedColors = (): string[] => {
    if (!selectedName) return []
    const colors = rarityColors[selectedName]
    return Array.isArray(colors) ? colors : [colors]
  }

  const updateSelectedColor = (index: number, color: string) => {
    const currentColors = getSelectedColors()
    const updated = [...currentColors]
    updated[index] = color
    handleColorChange(updated)
  }

  const addColorToSelected = () => {
    const currentColors = getSelectedColors()
    handleColorChange([...currentColors, "#ffffff"])
  }

  const removeColorFromSelected = (index: number) => {
    const currentColors = getSelectedColors()
    if (currentColors.length > 1) {
      handleColorChange(currentColors.filter((_, i) => i !== index))
    }
  }

  const getGradientStyle = (colors: string | string[]) => {
    if (Array.isArray(colors)) {
      return {
        background: `linear-gradient(45deg, ${colors.join(", ")})`,
      }
    }
    return { backgroundColor: colors }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 bg-transparent"
        >
          <Palette className="w-4 h-4 mr-2" />
          Edit Rarities
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900 border-purple-500/30 overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-purple-400">Manage Rarities & Gradients</DialogTitle>
          <DialogDescription>
            Add, remove, and edit rarity colors. Support for single colors and gradients.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
            {/* Add rarity form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-purple-400">Add New Rarity</h3>

              <div>
                <Label htmlFor="r-name">Rarity Name</Label>
                <Input
                  id="r-name"
                  placeholder="e.g., Legendary"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Colors {newColors.length > 1 && <Badge variant="secondary">Gradient</Badge>}</Label>
                  <Button size="sm" variant="outline" onClick={addColorToNew}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Color
                  </Button>
                </div>

                <div className="space-y-2">
                  {newColors.map((color, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={color}
                        onChange={(e) => updateNewColor(index, e.target.value)}
                        className="w-16 h-10 p-1 bg-slate-700 border-slate-600"
                      />
                      <Input
                        value={color}
                        onChange={(e) => updateNewColor(index, e.target.value)}
                        placeholder="#ffffff"
                        className="flex-1 bg-slate-700 border-slate-600"
                      />
                      {newColors.length > 1 && (
                        <Button size="sm" variant="destructive" onClick={() => removeColorFromNew(index)}>
                          <Trash className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Preview */}
                <div className="mt-2">
                  <Label className="text-sm text-gray-400">Preview:</Label>
                  <div
                    className="w-full h-8 rounded border border-slate-600 mt-1"
                    style={getGradientStyle(newColors)}
                  />
                </div>
              </div>

              <Button onClick={handleAddRarity} className="w-full bg-purple-600 hover:bg-purple-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Rarity
              </Button>
            </div>

            {/* Existing rarities list */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-purple-400">Existing Rarities</h3>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {fullOrder.map((name) => {
                  const colors = rarityColors[name]
                  const isGradient = Array.isArray(colors)

                  return (
                    <div
                      key={name}
                      className="flex items-center justify-between p-3 rounded-md hover:bg-slate-800 cursor-pointer transition-colors border border-slate-700"
                      onClick={() => setSelectedName(name)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded-full border border-slate-500"
                          style={getGradientStyle(colors)}
                        />
                        <div>
                          <span className="font-medium text-white">{name}</span>
                          {isGradient && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Gradient
                            </Badge>
                          )}
                        </div>
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-900 border-red-500/30">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently remove the rarity.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveRarity(name)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Color editor for selected rarity */}
          {selectedName && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-purple-400">Edit Colors for {selectedName}</h3>
                  <Button size="sm" variant="outline" onClick={addColorToSelected}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Color
                  </Button>
                </div>

                <div className="space-y-2">
                  {getSelectedColors().map((color, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={color}
                        onChange={(e) => updateSelectedColor(index, e.target.value)}
                        className="w-16 h-10 p-1 bg-slate-700 border-slate-600"
                      />
                      <Input
                        value={color}
                        onChange={(e) => updateSelectedColor(index, e.target.value)}
                        className="flex-1 bg-slate-700 border-slate-600"
                      />
                      {getSelectedColors().length > 1 && (
                        <Button size="sm" variant="destructive" onClick={() => removeColorFromSelected(index)}>
                          <Trash className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Preview */}
                <div>
                  <Label className="text-sm text-gray-400">Preview:</Label>
                  <div
                    className="w-full h-12 rounded border border-slate-600 mt-1"
                    style={getGradientStyle(getSelectedColors())}
                  />
                </div>
              </div>
            </>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
