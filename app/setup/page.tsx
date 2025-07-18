"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Shield, CheckCircle, Crown } from "lucide-react"
import Link from "next/link"
import bcrypt from "bcryptjs"

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handleCreateAdmin = async () => {
    setIsLoading(true)
    try {
      // Hash the password "admin123"
      const hashedPassword = await bcrypt.hash("admin123", 10)

      // Insert admin user
      const { error } = await supabase.from("users").upsert([
        {
          email: "admin@gamestore.com",
          password_hash: hashedPassword,
          is_admin: true,
        },
      ])

      if (error) {
        throw error
      }

      setIsComplete(true)
      toast.success("Admin account created successfully!")
    } catch (error) {
      toast.error("Failed to create admin account: " + (error as Error).message)
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20" />

      <Card className="w-full max-w-md premium-card relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-gaming neon-text">GameVault Setup</CardTitle>
          <CardDescription>Initialize your premium gaming marketplace</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isComplete ? (
            <>
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <h3 className="font-semibold text-blue-400 mb-2">Admin Account Details</h3>
                  <div className="space-y-1 text-sm text-gray-300">
                    <p>
                      <strong>Email:</strong> admin@gamestore.com
                    </p>
                    <p>
                      <strong>Password:</strong> admin123
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-400">
                  <p>• This will create the initial admin account</p>
                  <p>• You can change the password after first login</p>
                  <p>• Make sure your database is properly configured</p>
                </div>
              </div>

              <Button onClick={handleCreateAdmin} className="w-full premium-button" disabled={isLoading}>
                <Shield className="w-4 h-4 mr-2" />
                {isLoading ? "Creating Admin Account..." : "Create Admin Account"}
              </Button>
            </>
          ) : (
            <>
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
                <h3 className="text-xl font-semibold text-green-400">Setup Complete!</h3>
                <p className="text-gray-300">Your admin account has been created successfully.</p>
              </div>

              <div className="space-y-3">
                <Link href="/">
                  <Button className="w-full premium-button">Go to GameVault</Button>
                </Link>
                <p className="text-xs text-center text-gray-400">Use the credentials above to login as admin</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
