"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { signIn, signUp } from "@/lib/auth"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { LogIn, UserPlus, Shield, Settings } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export function LoginForm() {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [signupData, setSignupData] = useState({ email: "", password: "", confirmPassword: "" })
  const [testingMode, setTestingMode] = useState(true)

  useEffect(() => {
    // Fetch testing mode setting
    const fetchTestingMode = async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", "testing_mode")
        .single()

      if (data) {
        setTestingMode(data.setting_value === "true")
      }
    }

    fetchTestingMode()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const user = await signIn(loginData.email, loginData.password)
      login(user)
      toast.success("Successfully logged in!")
    } catch (error) {
      toast.error("Invalid credentials")
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (signupData.password !== signupData.confirmPassword) {
      toast.error("Passwords don't match")
      return
    }

    if (signupData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      await signUp(signupData.email, signupData.password)
      toast.success("Account created! Please log in.")
      setSignupData({ email: "", password: "", confirmPassword: "" })
    } catch (error) {
      toast.error("Failed to create account: " + (error as Error).message)
      console.error("Signup error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Quick login buttons for testing
  const handleQuickLogin = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const user = await signIn(email, password)
      login(user)
      toast.success("Successfully logged in!")
    } catch (error) {
      toast.error("Login failed - account may not exist yet")
      console.error("Quick login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20" />

      <Card className="w-full max-w-md premium-card relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-gaming neon-text">GameVault</CardTitle>
          <CardDescription>Access your premium gaming marketplace</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {testingMode && (
            <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <p className="text-sm text-yellow-400 mb-2">First time setup?</p>
              <Link href="/setup">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Create Admin Account
                </Button>
              </Link>
            </div>
          )}

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="data-[state=active]:bg-blue-600">
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-purple-600">
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="bg-slate-800/50 border-slate-600"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="bg-slate-800/50 border-slate-600"
                    required
                  />
                </div>
                <Button type="submit" className="w-full premium-button" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>

              {/* Quick Login Buttons for Testing */}
              {testingMode && (
                <div className="space-y-2 pt-4 border-t border-slate-700">
                  <p className="text-xs text-gray-400 text-center">Quick Login (for testing):</p>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickLogin("admin@gamestore.com", "admin123")}
                      disabled={isLoading}
                      className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <Shield className="w-3 h-3 mr-2" />
                      Login as Admin
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    className="bg-slate-800/50 border-slate-600"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    className="bg-slate-800/50 border-slate-600"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    className="bg-slate-800/50 border-slate-600"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full premium-button" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
