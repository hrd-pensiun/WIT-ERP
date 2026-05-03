/**
 * useInvoices - Real InsForge Database
 */

import { useState, useCallback, useEffect } from 'react'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

export function useInvoices(tenantId: string = getTenantId(), options?: { pollInterval?: number }) {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInvoices = useCallback(async () => {
    if (!insForge) {
      setError('Database not connected')
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: apiError } = await insForge
        .from('invoices')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('invoice_date', { ascending: false })

      if (apiError) throw apiError
      setInvoices(data || [])
      return data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const getInvoice = useCallback(async (id: string) => {
    if (!insForge) throw new Error('Database not connected')

    const { data, error } = await insForge
      .from('invoices')
      .select(`*, invoice_line_items(*)`)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) throw error
    return data
  }, [tenantId])

  const createInvoice = useCallback(async (data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('invoices')
      .insert({
        ...data,
        tenant_id: data.tenant_id ?? tenantId,
      })
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const updateInvoice = useCallback(async (id: string, data: any) => {
    if (!insForge) throw new Error('Database not connected')

    const { data: result, error } = await insForge
      .from('invoices')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    if (error) throw error
    return result
  }, [tenantId])

  const deleteInvoice = useCallback(async (id: string) => {
    if (!insForge) throw new Error('Database not connected')

    const { error } = await insForge
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) throw error
    return true
  }, [tenantId])

  useEffect(() => {
    fetchInvoices()

    if (options?.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(fetchInvoices, options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchInvoices, options?.pollInterval])

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    getInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
  }
}
