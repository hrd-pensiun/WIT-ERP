"use client"

import { useState, useEffect } from "react"
import { Clock, Play, Pause, Square, Calendar, User, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProjects } from "@/hooks/useProjects"

export default function TimeTrackingPage() {
  const [isTracking, setIsTracking] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [selectedProject, setSelectedProject] = useState("")
  const [selectedTask, setSelectedTask] = useState("")
  const [description, setDescription] = useState("")
  const { projects, loading } = useProjects()

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isTracking) {
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTracking])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Time Tracking</h1>
          <p className="text-muted-foreground mt-1">Track time spent on projects and tasks</p>
        </div>
      </div>

      {/* Timer Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Timer Display */}
            <div className="flex-1 flex items-center justify-center lg:justify-start">
              <div className="text-center">
                <div className="text-6xl font-mono font-bold text-foreground tracking-wider">
                  {formatTime(elapsed)}
                </div>
                <p className="text-muted-foreground mt-2">Total Time Tracked Today</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue placeholder={loading ? "Loading..." : "Select Project"} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedTask} onValueChange={setSelectedTask}>
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue placeholder="Select Task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                placeholder="What are you working on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-muted border-border"
              />

              <div className="flex gap-2">
                {!isTracking ? (
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    <Play className="w-4 h-4 mr-2" />
                    Start Timer
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" className="flex-1 border-border">
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                    <Button variant="destructive" className="flex-1">
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada time entry</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
