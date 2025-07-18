"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"

interface PurchaseSearchProps {
  onSearch: (term: string, filter: string) => void
  onClear: () => void
}

export function PurchaseSearch({ onSearch, onClear }: PurchaseSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")

  const handleSearch = () => {
    onSearch(searchTerm, filter)
  }

  const handleClear = () => {
    setSearchTerm("")
    setFilter("all")
    onClear()
  }

  return (
    <div className="flex gap-2 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search by email or purchase ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-700 border-slate-600"
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
      </div>
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-48 bg-slate-700 border-slate-600">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Requests</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
          <SelectItem value="email">Search by Email</SelectItem>
          <SelectItem value="purchase_id">Search by Purchase ID</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleSearch} variant="outline">
        Search
      </Button>
      <Button onClick={handleClear} variant="ghost" size="icon">
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
