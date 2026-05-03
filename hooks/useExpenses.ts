/**
 * useExpenses - Real InsForge Database
 */

import { useState, useCallback, useEffect } from 'react'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

export function useExpenses(tenantId: string = getTenantId(), options?: { pollInterval?: number }) {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchExpenses = useCallback(async () => {
    if (!insForge) {
      setError('Database not connected')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: apiError } = await insForge
        .from('expenses')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('expense_date', { ascending: false })

      if (apiError) throw apiError
      setExpenses(data || [])
      return data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const getExpense = useCallback(async (id: string) => {
    if (!insForge) throw new Error('Database not connected')

    const { data, error } = await insForge
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) throw error
    return data
  }, [tenantId])

  const createExpense = useCallback(async (data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('expenses')
      .insert({
        ...data,
        tenant_id: data.tenant_id ?? tenantId,
      })
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const updateExpense = useCallback(async (id: string, data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('expenses')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const deleteExpense = useCallback(async (id: string) => {
    if (!insForge) throw new Error('Database not connected')

    const { error } = await insForge
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) throw error
    return true
  }, [tenantId])

  useEffect(() => {
    fetchExpenses()

    if (options?.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(fetchExpenses, options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchExpenses, options?.pollInterval])

  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    getExpense,
    createExpense,
    updateExpense,
    deleteExpense,
  }
}
