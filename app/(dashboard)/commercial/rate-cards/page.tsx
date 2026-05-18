'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { fmtIDR } from '@/lib/commercial-data'
import type { RateCardEntry } from '@/lib/commercial-data'
import { insForge } from '@/lib/insforge'
import { cn } from '@/lib/utils'
import { Search, Plus, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react'

const TYPES = ['All', 'Consultant', 'Networking', 'Project', 'Web', 'WMS']

export default function RateCardsPage() {
  const [cards, setCards] = useState<RateCardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [typeFilter, setTypeFilter] = useState('All')
  const [search, setSearch] = useState('')

  const fetchCards = useCallback(async () => {
    if (!insForge) {
      // Fallback: import dynamically
      const { RATE_CARD } = await import('@/lib/commercial-data')
      setCards(RATE_CARD)
      setLoading(false)
      return
    }
    try {
      const { data, error } = await insForge
        .from("commercial_rate_cards")
        .select("*")
        .order("project_type")
        .order("group_name")
        .order("role_name")
      if (error) throw error
      setCards((data || []).map((r: any) => ({
        type: r.project_type,
        group: r.group_name,
        role: r.role_name,
        hpp: Number(r.hpp_rate) || 0,
        specialRate: Number(r.special_rate) || 0,
        publishRate: Number(r.publish_rate) || 0,
        isActive: r.is_active !== false,
        id: r.id,
      })))
    } catch {
      const { RATE_CARD } = await import('@/lib/commercial-data')
      setCards(RATE_CARD)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchCards() }, [fetchCards])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RateCardEntry | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState<RateCardEntry>({
    type: 'Consultant', group: '', role: '', hpp: 0, specialRate: 0, publishRate: 0, isActive: true,
  })
  const [formError, setFormError] = useState('')

  const filtered = useMemo(() =>
    cards.filter((c) => {
      if (typeFilter !== 'All' && c.type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          c.role.toLowerCase().includes(q) ||
          c.group.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q)
        )
      }
      return true
    }),
    [cards, typeFilter, search]
  )

  const openAdd = () => {
    setEditing(null)
    setForm({ type: 'Consultant', group: '', role: '', hpp: 0, specialRate: 0, publishRate: 0, isActive: true })
    setFormError('')
    setDialogOpen(true)
  }

  const openEdit = (entry: RateCardEntry) => {
    setEditing(entry)
    setForm({ ...entry })
    setFormError('')
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditing(null)
    setFormError('')
  }

  const handleSave = async () => {
    if (!form.group.trim() || !form.role.trim()) {
      setFormError('Group and Role are required.')
      return
    }
    if (form.hpp <= 0 || form.specialRate <= 0 || form.publishRate <= 0) {
      setFormError('All rate values must be greater than 0.')
      return
    }

    // Duplicate check
    const duplicate = cards.some(
      (c) =>
        c.type === form.type &&
        c.group === form.group &&
        c.role === form.role &&
        (!editing || (editing as any).id !== (c as any).id)
    )
    if (duplicate) {
      setFormError('An entry with this Type, Group, and Role already exists.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        project_type: form.type,
        group_name: form.group,
        role_name: form.role,
        hpp_rate: form.hpp,
        special_rate: form.specialRate,
        publish_rate: form.publishRate,
        is_active: form.isActive !== false,
      }

      if (editing && (editing as any).id) {
        if (insForge) {
          await insForge.from("commercial_rate_cards").update(payload).eq("id", (editing as any).id)
        }
        setCards((prev) => prev.map((c) => ((c as any).id === (editing as any).id ? { ...form, id: (editing as any).id } : c)))
      } else {
        if (insForge) {
          const { data } = await insForge.from("commercial_rate_cards").insert(payload).select().single()
          if (data) {
            setCards((prev) => [...prev, { ...form, id: data.id }])
          } else {
            setCards((prev) => [...prev, { ...form }])
          }
        } else {
          setCards((prev) => [...prev, { ...form }])
        }
      }
      setSaving(false)
      closeDialog()
    } catch (err) {
      console.error("Failed to save rate card:", err)
      setFormError('Failed to save to database.')
      setSaving(false)
    }
  }

  const handleDelete = async (entry: RateCardEntry & { id?: string }) => {
    if (insForge && entry.id) {
      try {
        await insForge.from("commercial_rate_cards").delete().eq("id", entry.id)
      } catch { /* ignore */ }
    }
    setCards((prev) => prev.filter((c) => (c as any).id !== entry.id))
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Rate Cards</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage pricing rates per role</p>
        </div>
        <button
          onClick={openAdd}
          className="text-xs px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors font-medium flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Rate
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 flex-1 min-w-[160px]">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by role, group, or type..."
              className="flex-1 px-2 py-1.5 text-xs bg-transparent border-0 outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>
          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors',
                typeFilter === t
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : `${filtered.length} rate card${filtered.length !== 1 ? 's' : ''}`}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Loading rate cards...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-zinc-500">
            No rate cards match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500">Group</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-500">Role</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-zinc-500 hidden md:table-cell">HPP</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-zinc-500 hidden md:table-cell">Special</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-zinc-500 hidden md:table-cell">Publish</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-zinc-500">Status</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, idx) => (
                  <tr key={`${entry.type}-${entry.group}-${entry.role}-${idx}`} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="py-3 px-4 text-xs font-medium text-zinc-700 dark:text-zinc-300">{entry.type}</td>
                    <td className="py-3 px-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">{entry.group}</td>
                    <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">{entry.role}</td>
                    <td className="py-3 px-4 text-right text-xs tabular-nums text-zinc-600 dark:text-zinc-400 hidden md:table-cell">{fmtIDR(entry.hpp)}</td>
                    <td className="py-3 px-4 text-right text-xs tabular-nums text-zinc-600 dark:text-zinc-400 hidden md:table-cell">{fmtIDR(entry.specialRate)}</td>
                    <td className="py-3 px-4 text-right text-xs tabular-nums text-zinc-600 dark:text-zinc-400 hidden md:table-cell">{fmtIDR(entry.publishRate)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-medium',
                        entry.isActive !== false
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                      )}>
                        {entry.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEdit(entry)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirm === ((entry as any).id || `${entry.type}-${entry.group}-${entry.role}`) ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(entry)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-[0.6rem] font-semibold">
                              Yes
                            </button>
                            <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-[0.6rem] font-semibold">
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm((entry as any).id || `${entry.type}-${entry.group}-${entry.role}`)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {editing ? 'Edit Rate Card' : 'Add Rate Card'}
              </h3>
              <button onClick={closeDialog} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg">{formError}</div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-semibold text-zinc-500 uppercase tracking-wider">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    {TYPES.filter((t) => t !== 'All').map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-semibold text-zinc-500 uppercase tracking-wider">Group</label>
                  <input
                    type="text"
                    value={form.group}
                    onChange={(e) => setForm({ ...form, group: e.target.value.toUpperCase() })}
                    placeholder="e.g. AA"
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-semibold text-zinc-500 uppercase tracking-wider">Role</label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="e.g. Consultant"
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-semibold text-zinc-500 uppercase tracking-wider">HPP (IDR)</label>
                  <input
                    type="number"
                    value={form.hpp || ''}
                    onChange={(e) => setForm({ ...form, hpp: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-semibold text-zinc-500 uppercase tracking-wider">Special Rate</label>
                  <input
                    type="number"
                    value={form.specialRate || ''}
                    onChange={(e) => setForm({ ...form, specialRate: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-semibold text-zinc-500 uppercase tracking-wider">Publish Rate</label>
                  <input
                    type="number"
                    value={form.publishRate || ''}
                    onChange={(e) => setForm({ ...form, publishRate: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive !== false}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500" />
                </label>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={closeDialog} className="text-xs px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="text-xs px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> {editing ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
