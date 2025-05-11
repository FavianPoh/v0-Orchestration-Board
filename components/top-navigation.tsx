"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Home, LayoutDashboard, PlayCircle, Settings, Sliders, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useModelState } from "@/context/model-state-context"

export function TopNavigation() {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { getRunId } = useModelState()
  const runId = getRunId()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <div className="flex flex-col gap-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-6 w-6 text-primary" />
                    <span className="text-lg font-semibold">FlowOrchestrator</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="flex flex-col gap-2">
                  <Link href="/" onClick={() => setSidebarOpen(false)}>
                    <Button variant={isActive("/") ? "default" : "ghost"} className="w-full justify-start">
                      <Home className="mr-2 h-4 w-4" />
                      Home
                    </Button>
                  </Link>
                  <Link href="/dashboard" onClick={() => setSidebarOpen(false)}>
                    <Button variant={isActive("/dashboard") ? "default" : "ghost"} className="w-full justify-start">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/workflows" onClick={() => setSidebarOpen(false)}>
                    <Button variant={isActive("/workflows") ? "default" : "ghost"} className="w-full justify-start">
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Workflows
                    </Button>
                  </Link>
                  <Link href="/sensitivity" onClick={() => setSidebarOpen(false)}>
                    <Button variant={isActive("/sensitivity") ? "default" : "ghost"} className="w-full justify-start">
                      <Sliders className="mr-2 h-4 w-4" />
                      Sensitivity Analysis
                    </Button>
                  </Link>
                </nav>
                <div className="border-t pt-4">
                  <h3 className="mb-2 text-sm font-medium">Model Groups</h3>
                  <nav className="flex flex-col gap-2">
                    <Link href="/model-groups/economic-models" onClick={() => setSidebarOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Economic Models
                      </Button>
                    </Link>
                    <Link href="/model-groups/financial-models" onClick={() => setSidebarOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Financial Models
                      </Button>
                    </Link>
                    <Link href="/model-groups/risk-models" onClick={() => setSidebarOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Risk Models
                      </Button>
                    </Link>
                  </nav>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <PlayCircle className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold hidden md:inline-block">FlowOrchestrator</span>
          </div>
        </div>

        <Tabs defaultValue="workflows" className="hidden md:block">
          <TabsList>
            <TabsTrigger value="home" asChild>
              <Link href="/">Home</Link>
            </TabsTrigger>
            <TabsTrigger value="dashboard" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </TabsTrigger>
            <TabsTrigger value="workflows" asChild>
              <Link href="/workflows">Workflows</Link>
            </TabsTrigger>
            <TabsTrigger value="sensitivity" asChild>
              <Link href="/sensitivity">Sensitivity Analysis</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {runId && (
            <div className="hidden md:flex items-center mr-2">
              <span className="text-sm font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded">Run #{runId}</span>
            </div>
          )}
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
