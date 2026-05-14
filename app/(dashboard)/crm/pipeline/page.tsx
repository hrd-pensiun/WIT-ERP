"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Target, Plus, DollarSign,
  Calendar, User, Building2, MoreHorizontal,
  TrendingUp, TrendingDown, ArrowRight,
  LayoutGrid, Table2, Eye, Edit3, Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterBar, FilterBarSearch } from "@/components/ui/filter-bar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useOpportunities } from "@/hooks/useOpportunities"
import { insForge } from "@/lib/insforge"

export default function CRMPipelinePage() {
  const { 
    opportunities, 
    loading, 
    PIPELINE_STAGES,
    fetchOpportunities, 
    updateStage,
    getPipelineStats 
  } = useOpportunities()
  
  const [search, setSearch] = useState("")
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('table')

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const stats = getPipelineStats()

  const handleDragStart = (oppId: string) => {
    setDraggingId(oppId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    if (draggingId) {
      await updateStage(draggingId, stageId)
      setDraggingId(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0)
  }

  const getPriorityColor = (priority?: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-muted-foreground/40'
    }
    return colors[priority || 'medium']
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-500" />
            Leads
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola leads dan data calon klien
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'kanban'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              Table
            </button>
          </div>
          <Link href="/crm/leads/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Leads</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(stats.totalValue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Weighted Value</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {formatCurrency(stats.weightedValue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-emerald-400">
                {opportunities.filter(o => o.stage === 'won').length}
              </p>
              <span className="text-muted-foreground">/</span>
              <p className="text-muted-foreground">{opportunities.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Avg Deal Size</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {opportunities.length > 0 
                ? formatCurrency(stats.totalValue / opportunities.length)
                : formatCurrency(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <FilterBar>
        <FilterBarSearch
          placeholder="Cari leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </FilterBar>

      {/* Table View */}
      {viewMode === 'table' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Title</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Lead #</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Contact</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground hidden md:table-cell">Company</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Source</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Value</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Stage</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Prob</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Priority</th>
                    <th className="w-20 py-3 px-4 text-xs font-semibold text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities
                    .filter((o) => search === '' || o.title?.toLowerCase().includes(search.toLowerCase()))
                    .length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-sm text-muted-foreground">
                        No leads found.
                      </td>
                    </tr>
                  ) : (
                    opportunities
                      .filter((o) => search === '' || o.title?.toLowerCase().includes(search.toLowerCase()))
                      .map((opp) => (
                        <tr key={opp.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 font-medium text-foreground text-sm">{opp.title}</td>
                          <td className="py-3 px-4">
                            <code className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                              {(opp as any).crm_leads?.lead_number || '-'}
                            </code>
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">{(opp as any).pic?.full_name || '-'}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground hidden md:table-cell">{(opp as any).crm_leads?.company_name || '-'}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground hidden sm:table-cell">{(opp as any).crm_leads?.lead_source || '-'}</td>
                          <td className="py-3 px-4 text-right text-xs font-medium text-emerald-400 tabular-nums">
                            {formatCurrency(opp.value || 0)}
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.6rem] font-medium ${
                              opp.stage === 'won' ? 'bg-emerald-500/10 text-emerald-400' :
                              opp.stage === 'lost' ? 'bg-red-500/10 text-red-400' :
                              opp.stage === 'negotiation' ? 'bg-amber-500/10 text-amber-400' :
                              opp.stage === 'proposal' ? 'bg-indigo-500/10 text-indigo-400' :
                              opp.stage === 'qualified' ? 'bg-purple-500/10 text-purple-400' :
                              opp.stage === 'contacted' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-blue-500/10 text-blue-400'
                            }`}>
                              {(() => {
                                const s = PIPELINE_STAGES.find(st => st.id === opp.stage)
                                return s?.name || opp.stage
                              })()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center hidden lg:table-cell">
                            <span className="text-xs text-muted-foreground">{opp.probability || 0}%</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${getPriorityColor((opp as any).crm_leads?.priority)}`} />
                              <span className="text-xs capitalize text-muted-foreground">{(opp as any).crm_leads?.priority || 'medium'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center gap-0.5 justify-end">
                              <Link
                                href={`/crm/leads/${opp.lead_id}`}
                                className="p-1.5 rounded text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                                title="Lihat Detail"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                              <Link
                                href={`/crm/leads/${opp.lead_id}/edit`}
                                className="p-1.5 rounded text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                                title="Edit Lead"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                onClick={async () => {
                                  if (!confirm("Yakin ingin menghapus lead ini?")) return
                                  if (!insForge) return
                                  try {
                                    await insForge.from("crm_leads")
                                      .update({ deleted_at: new Date().toISOString() })
                                      .eq("id", opp.lead_id)
                                    fetchOpportunities()
                                  } catch (err) {
                                    console.error("Failed to delete lead:", err)
                                  }
                                }}
                                className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                title="Hapus Lead"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {PIPELINE_STAGES.filter(s => s.id !== 'Closed Lost').map((stage) => {
            const stageOpps = opportunities.filter(o => 
              o.stage === stage.id && 
              (search === '' || o.title?.toLowerCase().includes(search.toLowerCase()))
            )
            const stageValue = stageOpps.reduce((sum, o) => sum + (o.value || 0), 0)
            
            return (
              <div 
                key={stage.id}
                className="w-80 flex-shrink-0"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div className="h-1 rounded-t" style={{ backgroundColor: stage.color }} />
                <div className="bg-card border border-border border-t-0 rounded-b-lg p-4">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 group relative">
                      <h3 className="font-semibold text-foreground cursor-help">{stage.name}</h3>
                      {stage.description && (
                        <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block bg-popover text-popover-foreground text-xs rounded-md px-3 py-1.5 shadow-lg border whitespace-nowrap pointer-events-none">
                          {stage.description}
                        </div>
                      )}
                      <Badge variant="secondary" className="bg-muted">
                        {stageOpps.length}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(stageValue)}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-3">
                    {stageOpps.map((opp) => (
                      <div
                        key={opp.id}
                        draggable
                        onDragStart={() => handleDragStart(opp.id)}
                        className={`
                          bg-background border border-border rounded-lg p-3
                          cursor-move hover:border-emerald-500/50 transition-colors
                          ${draggingId === opp.id ? 'opacity-50' : ''}
                        `}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-foreground text-sm line-clamp-2">
                            {opp.title}
                          </p>
                          <div className={`w-2 h-2 rounded-full shrink-0 ${getPriorityColor((opp as any).crm_leads?.priority)}`} />
                        </div>

                        {(opp as any).crm_leads?.lead_number && (
                          <code className="text-[0.6rem] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded mb-2 inline-block">
                            {(opp as any).crm_leads?.lead_number}
                          </code>
                        )}

                        <p className="text-lg font-bold text-emerald-400 mb-2">
                          {formatCurrency(opp.value || 0)}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {(opp as any).pic?.full_name || 'Unassigned'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {opp.expected_close_date 
                              ? new Date(opp.expected_close_date).toLocaleDateString('id-ID', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })
                              : 'No date'}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Progress value={opp.probability || 0} className="w-12 h-1" />
                            <span className="text-xs text-muted-foreground">{opp.probability}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {stageOpps.length === 0 && !loading && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No leads
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Lost column */}
          {(() => {
            const lostStage = PIPELINE_STAGES.find(s => s.id === 'Closed Lost')
            const lostOpps = opportunities.filter(o => 
              o.stage === 'lost' && 
              (search === '' || o.title?.toLowerCase().includes(search.toLowerCase()))
            )
            
            return (
              <div className="w-80 flex-shrink-0">
                <div className="h-1 rounded-t" style={{ backgroundColor: lostStage?.color || '#ef4444' }} />
                <div className="bg-card border border-border border-t-0 rounded-b-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{lostStage?.name}</h3>
                      <Badge variant="secondary" className="bg-muted">
                        {lostOpps.length}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {lostOpps.map((opp) => (
                      <div
                        key={opp.id}
                        className="bg-background border border-border rounded-lg p-3 opacity-60"
                      >
                        <p className="font-medium text-muted-foreground text-sm line-through">
                          {opp.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {(opp as any).loss_reason || 'No reason'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
      )}
    </div>
  )
}
