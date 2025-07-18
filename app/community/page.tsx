"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, MessageSquare, Plus, Pin, Crown, Calendar } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import Image from "next/image"

type CommunityPost = {
  id: number
  user_id: number
  title: string
  content: string
  image_url: string | null
  is_pinned: boolean
  created_at: string
  updated_at: string
  user: {
    email: string
    is_admin: boolean
  }
  reactions: PostReaction[]
}

type PostReaction = {
  id: number
  post_id: number
  user_id: number
  emoji: string
  created_at: string
}

const EMOJI_OPTIONS = ["❤️", "👍", "😂", "😮", "😢", "😡", "🔥", "🎉", "👏", "💯"]

export default function CommunityPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Form state
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    image_url: "",
  })

  useEffect(() => {
    if (user) {
      fetchPosts()
      fetchUserPermissions()
    }
  }, [user])

  const fetchUserPermissions = async () => {
    if (!user) return

    try {
      const { data } = await supabase
        .from("user_permissions")
        .select("permission_key")
        .eq("user_id", user.id)
        .eq("permission_value", true)

      if (data) {
        setUserPermissions(data.map((p) => p.permission_key))
      }
    } catch (error) {
      console.error("Error fetching user permissions:", error)
    }
  }

  const hasPermission = (permission: string) => {
    return user?.is_admin || userPermissions.includes(permission)
  }

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from("community_posts")
        .select(
          `
          *,
          user:users(email, is_admin)
        `,
        )
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })

      if (postsError) throw postsError

      // Fetch reactions for each post
      const postsWithReactions = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: reactions } = await supabase
            .from("post_reactions")
            .select("*")
            .eq("post_id", post.id)
            .order("created_at", { ascending: false })

          return {
            ...post,
            reactions: reactions || [],
          }
        }),
      )

      setPosts(postsWithReactions)
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast.error("Failed to load community posts")
    }
  }

  const handleCreatePost = async () => {
    if (!user || !newPost.title.trim() || !newPost.content.trim()) {
      toast.error("Title and content are required")
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase.from("community_posts").insert([
        {
          user_id: user.id,
          title: newPost.title.trim(),
          content: newPost.content.trim(),
          image_url: newPost.image_url.trim() || null,
        },
      ])

      if (error) throw error

      toast.success("Post created successfully!")
      setIsCreateDialogOpen(false)
      setNewPost({ title: "", content: "", image_url: "" })
      fetchPosts()
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Failed to create post")
    } finally {
      setLoading(false)
    }
  }

  const handleReaction = async (postId: number, emoji: string) => {
    if (!user) return

    try {
      // Check if user already reacted with this emoji
      const existingReaction = posts
        .find((p) => p.id === postId)
        ?.reactions.find((r) => r.user_id === user.id && r.emoji === emoji)

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase.from("post_reactions").delete().eq("id", existingReaction.id)

        if (error) throw error
      } else {
        // Add reaction
        const { error } = await supabase.from("post_reactions").insert([
          {
            post_id: postId,
            user_id: user.id,
            emoji: emoji,
          },
        ])

        if (error) throw error
      }

      fetchPosts()
    } catch (error) {
      console.error("Error handling reaction:", error)
      toast.error("Failed to update reaction")
    }
  }

  const togglePin = async (postId: number, currentPinned: boolean) => {
    if (!hasPermission("create_community_posts")) return

    try {
      const { error } = await supabase.from("community_posts").update({ is_pinned: !currentPinned }).eq("id", postId)

      if (error) throw error

      toast.success(currentPinned ? "Post unpinned" : "Post pinned")
      fetchPosts()
    } catch (error) {
      console.error("Error toggling pin:", error)
      toast.error("Failed to update pin status")
    }
  }

  const getReactionCounts = (reactions: PostReaction[]) => {
    const counts: Record<string, { count: number; userReacted: boolean }> = {}

    reactions.forEach((reaction) => {
      if (!counts[reaction.emoji]) {
        counts[reaction.emoji] = { count: 0, userReacted: false }
      }
      counts[reaction.emoji].count++
      if (reaction.user_id === user?.id) {
        counts[reaction.emoji].userReacted = true
      }
    })

    return counts
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="premium-card">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400 mb-4">Please log in to view the community.</p>
            <Link href="/">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-gaming font-bold text-purple-400">GameVault Community</h1>
            </div>
            {hasPermission("create_community_posts") && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-slate-900 border-purple-500/30">
                  <DialogHeader>
                    <DialogTitle className="text-purple-400">Create New Post</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newPost.title}
                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                        placeholder="Enter post title..."
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={newPost.content}
                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                        placeholder="What's on your mind?"
                        className="bg-slate-700 border-slate-600 min-h-32"
                      />
                    </div>
                    <div>
                      <Label htmlFor="image">Image URL (optional)</Label>
                      <Input
                        id="image"
                        value={newPost.image_url}
                        onChange={(e) => setNewPost({ ...newPost, image_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                    <Button
                      onClick={handleCreatePost}
                      disabled={loading || !newPost.title.trim() || !newPost.content.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {loading ? "Creating..." : "Create Post"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No posts yet</h3>
              <p className="text-gray-500">Be the first to share something with the community!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => {
                const reactionCounts = getReactionCounts(post.reactions)

                return (
                  <Card key={post.id} className="premium-card">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-purple-500/20 text-purple-400">
                              {post.user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white">{post.user.email}</p>
                              {post.user.is_admin && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Admin
                                </Badge>
                              )}
                              {post.is_pinned && (
                                <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                                  <Pin className="w-3 h-3 mr-1" />
                                  Pinned
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(post.created_at)}
                            </p>
                          </div>
                        </div>
                        {hasPermission("create_community_posts") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => togglePin(post.id, post.is_pinned)}
                            className="text-gray-400 hover:text-blue-400"
                          >
                            <Pin className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <CardTitle className="text-purple-400">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-300 whitespace-pre-wrap">{post.content}</p>

                      {post.image_url && (
                        <div className="relative aspect-video rounded-lg overflow-hidden">
                          <Image
                            src={post.image_url || "/placeholder.svg"}
                            alt="Post image"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      {/* Reactions */}
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-700">
                        {/* Reaction buttons */}
                        <div className="flex gap-1">
                          {EMOJI_OPTIONS.map((emoji) => (
                            <Button
                              key={emoji}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReaction(post.id, emoji)}
                              className="text-lg hover:bg-slate-700 p-1 h-8 w-8"
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>

                        {/* Reaction counts */}
                        {Object.keys(reactionCounts).length > 0 && (
                          <div className="flex flex-wrap gap-2 ml-4">
                            {Object.entries(reactionCounts).map(([emoji, { count, userReacted }]) => (
                              <Badge
                                key={emoji}
                                variant="secondary"
                                className={`cursor-pointer transition-colors ${
                                  userReacted
                                    ? "bg-purple-500/20 text-purple-400 border-purple-500/50"
                                    : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                                }`}
                                onClick={() => handleReaction(post.id, emoji)}
                              >
                                {emoji} {count}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
