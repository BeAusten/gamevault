"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, Copy, Trash2, Download, ImageIcon, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import Image from "next/image"

interface UploadedImage {
  id: number
  name: string
  original_name: string
  url: string
  original_width: number
  original_height: number
  resized_width: number
  resized_height: number
  file_size?: number
  mime_type?: string
  created_at: string
}

export function ImageUploader() {
  const { user } = useAuth()
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resizeWidth, setResizeWidth] = useState("400")
  const [resizeHeight, setResizeHeight] = useState("400")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    fetchUploadedImages()
  }, [])

  const fetchUploadedImages = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("uploaded_images")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setUploadedImages(data || [])
    } catch (error) {
      console.error("Error fetching images:", error)
      toast.error("Failed to load images")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`)
        continue
      }

      try {
        // Get original dimensions
        const originalDimensions = await getImageDimensions(file)

        // Resize image
        const resizedBlob = await resizeImage(file, Number.parseInt(resizeWidth), Number.parseInt(resizeHeight))

        // Convert blob to base64 for storage
        const base64Data = await blobToBase64(resizedBlob)

        // Generate unique filename
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substr(2, 9)
        const fileName = `${timestamp}_${randomId}_${file.name}`

        // Save to database
        const { data, error } = await supabase
          .from("uploaded_images")
          .insert([
            {
              name: fileName,
              original_name: file.name,
              url: base64Data,
              original_width: originalDimensions.width,
              original_height: originalDimensions.height,
              resized_width: Number.parseInt(resizeWidth),
              resized_height: Number.parseInt(resizeHeight),
              file_size: resizedBlob.size,
              mime_type: resizedBlob.type,
              created_by: user?.id,
            },
          ])
          .select()

        if (error) throw error

        toast.success(`${file.name} uploaded and saved successfully!`)
      } catch (error) {
        toast.error(`Failed to process ${file.name}`)
        console.error("Image processing error:", error)
      }
    }

    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    // Refresh the images list
    await fetchUploadedImages()
  }

  const resizeImage = (file: File, targetWidth: number, targetHeight: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) {
          reject(new Error("Canvas not available"))
          return
        }

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Canvas context not available"))
          return
        }

        canvas.width = targetWidth
        canvas.height = targetHeight

        // Clear canvas
        ctx.clearRect(0, 0, targetWidth, targetHeight)

        // Draw resized image
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Failed to create blob"))
            }
          },
          "image/png",
          0.9,
        )
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success("Image URL copied to clipboard!")
  }

  const deleteImage = async (id: number) => {
    try {
      const { error } = await supabase.from("uploaded_images").delete().eq("id", id)

      if (error) throw error

      await fetchUploadedImages()
      toast.success("Image deleted!")
    } catch (error) {
      console.error("Error deleting image:", error)
      toast.error("Failed to delete image")
    }
  }

  const downloadImage = (url: string, name: string) => {
    const link = document.createElement("a")
    link.href = url
    link.download = `resized_${name}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown"
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 bg-transparent"
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Image Uploader
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-slate-900 border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-purple-400 flex items-center gap-2">
            Image Uploader & Resizer
            <Button size="sm" variant="ghost" onClick={fetchUploadedImages} disabled={isLoading} className="ml-auto">
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh]">
          {/* Upload Section */}
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-purple-400">Upload & Resize Images</CardTitle>
              <CardDescription>Upload images and automatically resize them to your desired dimensions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="resize-width">Width (px)</Label>
                  <Input
                    id="resize-width"
                    type="number"
                    value={resizeWidth}
                    onChange={(e) => setResizeWidth(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                    min="1"
                    max="5000"
                  />
                </div>
                <div>
                  <Label htmlFor="resize-height">Height (px)</Label>
                  <Input
                    id="resize-height"
                    type="number"
                    value={resizeHeight}
                    onChange={(e) => setResizeHeight(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                    min="1"
                    max="5000"
                  />
                </div>
              </div>

              <div className="border-2 border-dashed border-purple-500/30 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <p className="text-gray-300 mb-2">
                  Drag and drop images here, or{" "}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    browse files
                  </button>
                </p>
                <p className="text-sm text-gray-400">
                  Images will be resized to {resizeWidth}x{resizeHeight} pixels and saved permanently
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="mt-4 bg-purple-600 hover:bg-purple-700"
                >
                  {isUploading ? "Processing..." : "Select Images"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Images */}
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-purple-400">
                Saved Images ({uploadedImages.length})
                {isLoading && <span className="text-sm text-gray-400 ml-2">(Loading...)</span>}
              </CardTitle>
              <CardDescription>Click on image URLs to copy them for use in products</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {uploadedImages.length === 0 ? (
                  <div className="text-center py-8">
                    <ImageIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                    <p className="text-gray-400">No images uploaded yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uploadedImages.map((image) => (
                      <Card key={image.id} className="bg-slate-700/50 border-slate-600">
                        <CardContent className="p-4">
                          <div className="aspect-square relative mb-3 rounded-lg overflow-hidden bg-slate-600">
                            <Image
                              src={image.url || "/placeholder.svg"}
                              alt={image.original_name}
                              fill
                              className="object-cover"
                            />
                          </div>

                          <div className="space-y-2">
                            <p className="font-semibold text-white text-sm truncate" title={image.original_name}>
                              {image.original_name}
                            </p>

                            <div className="flex gap-1 flex-wrap">
                              <Badge variant="secondary" className="text-xs">
                                {image.resized_width}x{image.resized_height}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {formatFileSize(image.file_size)}
                              </Badge>
                            </div>

                            <div className="text-xs text-gray-400">
                              Original: {image.original_width}x{image.original_height}
                            </div>

                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyImageUrl(image.url)}
                                className="flex-1 text-xs"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy URL
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadImage(image.url, image.original_name)}
                                className="text-xs"
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteImage(image.id)}
                                className="text-xs"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>

                            <div className="text-xs text-gray-400">
                              {new Date(image.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  )
}
