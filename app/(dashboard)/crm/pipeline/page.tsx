"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Target, Plus, Search, Filter, DollarSign,
  Calendar, User, Building2, MoreHorizontal,
  TrendingUp, TrendingDown, ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useOpportunities } from "@/hooks/useOpportunities"

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
      low: 'bg-slate-500'
    }
    return colors[priority || 'medium']
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-500" />
            Pipeline CRM
          </h1>
          <p className="text-slate-400 mt-1">
            Kelola deals dan opportunities
          </p>
        </div>
        <Link href="/crm/leads/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Lead
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Total Pipeline</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">
              {formatCurrency(stats.totalValue)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Weighted Value</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {formatCurrency(stats.weightedValue)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Win Rate</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-emerald-400">
                {opportunities.filter(o => o.stage === 'won').length}
              </p>
              <span className="text-slate-500">/</span>
              <p className="text-slate-400">{opportunities.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Avg Deal Size</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {opportunities.length > 0 
                ? formatCurrency(stats.totalValue / opportunities.length)
                : formatCurrency(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari deals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-950 border-slate-800 text-slate-100"
            />
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {PIPELINE_STAGES.filter(s => s.id !== 'lost').map((stage) => {
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
                <div className={`${stage.color} h-1 rounded-t`} />
                <div className="bg-slate-900 border border-slate-800 border-t-0 rounded-b-lg p-4">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-200">{stage.name}</h3>
                      <Badge variant="secondary" className="bg-slate-800">
                        {stageOpps.length}
                      </Badge>
                    </div>
                    <span className="text-sm text-slate-500">
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
                          bg-slate-950 border border-slate-800 rounded-lg p-3
                          cursor-move hover:border-emerald-500/50 transition-colors
                          ${draggingId === opp.id ? 'opacity-50' : ''}
                        `}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-slate-200 text-sm line-clamp-2">
                            {opp.title}
                          </p>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor()}`} />
                        </div>

                        <p className="text-lg font-bold text-emerald-400 mb-2">
                          {formatCurrency(opp.value || 0)}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {(opp as any).pic?.full_name || 'Unassigned'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
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
                            <span className="text-xs text-slate-500">{opp.probability}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {stageOpps.length === 0 && !loading && (
                      <div className="text-center py-8 text-slate-600 text-sm">
                        No deals
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Lost column */}
          {(() => {
            const lostStage = PIPELINE_STAGES.find(s => s.id === 'lost')
            const lostOpps = opportunities.filter(o => 
              o.stage === 'lost' && 
              (search === '' || o.title?.toLowerCase().includes(search.toLowerCase()))
            )
            
            return (
              <div className="w-80 flex-shrink-0">
                <div className="bg-red-500 h-1 rounded-t" />
                <div className="bg-slate-900 border border-slate-800 border-t-0 rounded-b-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-200">{lostStage?.name}</h3>
                      <Badge variant="secondary" className="bg-slate-800">
                        {lostOpps.length}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {lostOpps.map((opp) => (
                      <div
                        key={opp.id}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-3 opacity-60"
                      >
                        <p className="font-medium text-slate-400 text-sm line-through">
                          {opp.title}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
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
    </div>
  )
}
