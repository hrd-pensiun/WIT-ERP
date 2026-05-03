/**
 * useProjects - Real InsForge Database
 */

import { useState, useCallback, useEffect } from 'react'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

const TASK_STATUSES = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
]

export function useProjects(tenantId: string = getTenantId(), options?: { pollInterval?: number }) {
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async (filters?: { status?: string; search?: string }) => {
    if (!insForge) {
      setError('Database not connected')
      return []
    }
    
    setLoading(true)
    setError(null)
    
    try {
      let query = insForge
        .from('projects')
        .select('*')
        .eq('tenant_id', tenantId)
      
      if (filters?.status) query = query.eq('status', filters.status)
      
      const { data, error: apiError } = await query.order('created_at', { ascending: false })
      
      if (apiError) throw apiError
      
      let filtered = data || []
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        filtered = filtered.filter((p: any) => 
          p.project_name?.toLowerCase().includes(searchLower) ||
          p.project_code?.toLowerCase().includes(searchLower)
        )
      }
      
      setProjects(filtered)
      return filtered
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const createProject = useCallback(async (data: any) => {
    if (!insForge) throw new Error('Database not connected')
    
    const { data: result, error } = await insForge.from('projects').insert({
      ...data,
      tenant_id: data.tenant_id ?? tenantId,
    }).select().single()
    if (error) throw error
    return result
  }, [tenantId])

  const updateProject = useCallback(async (id: string, data: any) => {
    if (!insForge) throw new Error('Database not connected')
    
    const { data: result, error } = await insForge
      .from('projects')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const deleteProject = useCallback(async (id: string) => {
    if (!insForge) throw new Error('Database not connected')

    const { error } = await insForge
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) throw error
    return true
  }, [tenantId])

  const getTasks = useCallback(async (projectId: string) => {
    if (!insForge) throw new Error('Database not connected')
    
    const { data, error } = await insForge
      .from('project_tasks')
      .select(`*, user_profiles:assigned_to(full_name)`)
      .eq('project_id', projectId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }, [tenantId])

  const fetchTasks = useCallback(async (projectId?: string) => {
    if (!insForge) {
      setError('Database not connected')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      let query = insForge
        .from('project_tasks')
        .select(`
          *,
          assignee:assigned_to(full_name),
          project:project_id(project_name)
        `)
        .eq('tenant_id', tenantId)

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error: apiError } = await query.order('created_at', { ascending: false })
      if (apiError) throw apiError

      const taskRows = data || []
      setTasks(taskRows)
      return taskRows
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const createTask = useCallback(async (data: any) => {
    if (!insForge) throw new Error('Database not connected')
    
    const { data: result, error } = await insForge.from('project_tasks').insert({
      ...data,
      tenant_id: data.tenant_id ?? tenantId,
    }).select().single()
    if (error) throw error
    return result
  }, [tenantId])

  const updateTask = useCallback(async (id: string, data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('project_tasks')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const updateTaskStatus = useCallback(async (id: string, status: string) => {
    return updateTask(id, { status })
  }, [updateTask])

  const deleteTask = useCallback(async (id: string) => {
    if (!insForge) throw new Error('Database not connected')

    const { error } = await insForge
      .from('project_tasks')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) throw error
    return true
  }, [tenantId])

  const getKanbanColumns = useCallback(() => TASK_STATUSES, [])

  useEffect(() => {
    fetchProjects()
    
    if (options?.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(fetchProjects, options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchProjects, options?.pollInterval])

  return {
    projects,
    tasks,
    loading,
    error,
    TASK_STATUSES,
    fetchProjects,
    createProject,
    updateProject,
    update: updateProject,
    deleteProject,
    getTasks,
    fetchTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    getKanbanColumns,
  }
}
