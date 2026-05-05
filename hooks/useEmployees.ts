/**
 * useEmployees - Real InsForge Database
 */

import { useState, useCallback, useEffect } from 'react'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

interface EmployeeFilters {
  status?: string
  department_id?: string
  employment_type?: string
  search?: string
}

/** Select sama untuk list, detail single, dan hasil update — agar FK + embed konsisten di UI. */
const EMPLOYEE_WITH_RELATIONS =
  `*, divisions:division_id(name), departments:department_id(name, entity_id), hr_positions:position_id(name), hr_job_grades:job_grade_id(name, level)`

export function useEmployees(tenantId: string = getTenantId(), options?: { pollInterval?: number }) {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEmployees = useCallback(async (filters?: EmployeeFilters) => {
    if (!insForge) {
      setError('Database not connected')
      return []
    }
    
    setLoading(true)
    setError(null)
    
    try {
      let query = insForge
        .from('user_profiles')
        .select(EMPLOYEE_WITH_RELATIONS)
        .eq('tenant_id', tenantId)
      
      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.department_id) query = query.eq('department_id', filters.department_id)
      if (filters?.employment_type) query = query.eq('employment_type', filters.employment_type)
      
      const { data, error: apiError } = await query.order('created_at', { ascending: false })
      
      if (apiError) throw apiError
      
      let filtered = data || []
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        filtered = filtered.filter((e: any) => 
          e.full_name?.toLowerCase().includes(searchLower) ||
          e.employee_number?.toLowerCase().includes(searchLower) ||
          e.email?.toLowerCase().includes(searchLower)
        )
      }
      
      setEmployees(filtered)
      return filtered
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const getEmployee = useCallback(async (id: string) => {
    if (!insForge) throw new Error('Database not connected')
    
    const { data, error } = await insForge
      .from('user_profiles')
      .select(EMPLOYEE_WITH_RELATIONS)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()
    
    if (error) throw error
    return data
  }, [tenantId])

  const createEmployee = useCallback(async (data: any) => {
    if (!insForge) throw new Error('Database not connected')
    
    const { data: result, error } = await insForge.from('user_profiles').insert({
      ...data,
      tenant_id: data.tenant_id ?? tenantId,
    }).select().single()
    if (error) throw error
    return result
  }, [tenantId])

  const updateEmployee = useCallback(async (id: string, data: any) => {
    if (!insForge) throw new Error('Database not connected')
    
    const { data: result, error } = await insForge
      .from('user_profiles')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select(EMPLOYEE_WITH_RELATIONS)
      .single()
    if (error) throw error
    if (result) {
      setEmployees((prev) => {
        const idx = prev.findIndex((e: { id: string }) => e.id === id)
        if (idx === -1) return [result as any, ...prev]
        const next = [...prev]
        next[idx] = result as any
        return next
      })
    }
    return result
  }, [tenantId])

  const deleteEmployee = useCallback(async (id: string) => {
    if (!insForge) throw new Error('Database not connected')
    
    const { error } = await insForge
      .from('user_profiles')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) throw error
    return true
  }, [tenantId])

  const generateEmployeeNumber = useCallback(async () => {
    const prefix = 'EMP'
    const year = new Date().getFullYear()
    const random = Math.floor(100 + Math.random() * 900)
    return `${prefix}-${year}-${random}`
  }, [])

  // Auto-fetch + polling
  useEffect(() => {
    fetchEmployees()
    
    if (options?.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(() => fetchEmployees(), options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchEmployees, options?.pollInterval])

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    generateEmployeeNumber,
    // Backward-compatible aliases for existing pages
    update: updateEmployee,
    remove: deleteEmployee
  }
}
