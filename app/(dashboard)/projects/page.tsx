"use client"

import Link from "next/link"
import { useState } from "react"
import { FolderKanban, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useProjects } from "@/hooks/useProjects"

export default function ProjectsPage() {
  const { projects, loading, deleteProject, fetchProjects } = useProjects()
  const [actionError, setActionError] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus project ini?")) return
    setActionError(null)
    try {
      await deleteProject(id)
      await fetchProjects()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menghapus project")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground text-sm">Kelola project dan progress</p>
        </div>
        <Link href="/projects/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Project Baru
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-emerald-500" />
            Daftar Project
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actionError && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {actionError}
            </div>
          )}
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Belum ada project</div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                  <div>
                    <p className="font-medium text-foreground">{project.project_name}</p>
                    <p className="text-xs text-muted-foreground">{project.project_code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-muted text-foreground">{project.status || "planning"}</Badge>
                    <Link href={`/projects/${project.id}/edit`}>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400" onClick={() => handleDelete(project.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
