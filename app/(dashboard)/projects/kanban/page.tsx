"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  LayoutGrid, Plus, Clock, Calendar,
  User, MoreHorizontal, AlertCircle, CheckCircle2,
  Circle, Pencil, Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterBar, FilterBarSearch, FilterBarSeparator } from "@/components/ui/filter-bar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useProjects } from "@/hooks/useProjects"

const PRIORITY_COLORS = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-muted-foreground/40'
}

export default function ProjectKanbanPage() {
  const { 
    projects, 
    tasks, 
    loading, 
    TASK_STATUSES,
    fetchProjects, 
    fetchTasks,
    updateTaskStatus,
    deleteTask,
    getKanbanColumns
  } = useProjects()
  
  const [selectedProject, setSelectedProject] = useState<string | 'all'>('all')
  const [search, setSearch] = useState("")
  const [draggingTask, setDraggingTask] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject !== 'all') {
      fetchTasks(selectedProject)
    } else {
      fetchTasks()
    }
  }, [selectedProject])

  const kanbanColumns = getKanbanColumns()

  const handleDragStart = (taskId: string) => {
    setDraggingTask(taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault()
    if (draggingTask) {
      setActionError(null)
      try {
        await updateTaskStatus(draggingTask, status)
        setDraggingTask(null)
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Gagal update status task")
      }
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Hapus task ini?")) return
    setActionError(null)
    try {
      await deleteTask(taskId)
      if (selectedProject !== "all") {
        await fetchTasks(selectedProject)
      } else {
        await fetchTasks()
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menghapus task")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case 'review': return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />
      default: return <Circle className="w-4 h-4 text-muted-foreground" />
    }
  }

  const filteredTasks = tasks.filter(t => 
    search === '' || t.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-emerald-500" />
            Project Kanban
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola tasks dan progress project
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/projects/new">
            <Button variant="outline" className="border-border">
              <Plus className="w-4 h-4 mr-2" />
              Project Baru
            </Button>
          </Link>
          <Link href="/projects/tasks/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Task Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* Project Filter */}
      {actionError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {actionError}
        </div>
      )}
      <FilterBar>
        <FilterBarSearch
          placeholder="Cari tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FilterBarSeparator />
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="h-8 text-sm w-auto min-w-[160px]">
            <SelectValue placeholder="Semua Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Project</SelectItem>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {kanbanColumns.map((column) => (
            <div 
              key={column.id}
              className="w-80 flex-shrink-0"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="bg-card border border-border rounded-lg">
                {/* Column Header */}
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(column.id)}
                    <h3 className="font-semibold text-foreground">{column.title}</h3>
                    <Badge variant="secondary" className="bg-muted">
                      {filteredTasks.filter(t => t.status === column.id).length}
                    </Badge>
                  </div>
                </div>

                {/* Tasks */}
                <div className="p-3 space-y-3 min-h-[200px]">
                  {filteredTasks
                    .filter(t => t.status === column.id)
                    .map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      className={`
                        bg-background border border-border rounded-lg p-3
                        cursor-move hover:border-emerald-500/50 transition-colors
                        ${draggingTask === task.id ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-foreground text-sm">
                          {task.title}
                        </p>
                        <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.medium}`} />
                      </div>

                      {(task as any).project && selectedProject === 'all' && (
                        <Badge variant="outline" className="mb-2 text-xs border-border text-muted-foreground">
                          {(task as any).project.project_name}
                        </Badge>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Clock className="w-3 h-3" />
                        <span>
                          {task.estimated_hours && task.estimated_hours > 0 
                            ? `${task.estimated_hours}h est`
                            : 'No estimate'}
                        </span>
                        {task.actual_hours > 0 && (
                          <>
                            <span>•</span>
                            <span>{task.actual_hours}h spent</span>
                          </>
                        )}
                      </div>

                      {task.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString('id-ID', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-1">
                          {(task as any).assignee ? (
                            <>
                              <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <span className="text-xs text-emerald-500">
                                  {(task as any).assignee.full_name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {(task as any).assignee.full_name}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">Unassigned</span>
                          )}
                        </div>
                        
                        {task.progress_percent > 0 && (
                          <div className="flex items-center gap-1">
                            <Progress value={task.progress_percent} className="w-12 h-1" />
                            <span className="text-xs text-muted-foreground">{task.progress_percent}%</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex justify-end gap-1">
                        <Link href={`/projects/${task.project_id}/tasks/${task.id}/edit`}>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </Link>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-red-400"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {filteredTasks.filter(t => t.status === column.id).length === 0 && !loading && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
