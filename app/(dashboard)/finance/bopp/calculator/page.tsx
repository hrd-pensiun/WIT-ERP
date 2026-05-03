"use client"

import { useState, useEffect } from "react"
import { Calculator, RefreshCw, DollarSign, Users, PieChart, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useBoppFormulas } from "@/hooks/useBoppFormulas"

interface BoppCalculation {
  revenue: number
  marketing: number
  se: number
  management: number
  tech: number
  operational: number
  totalDistributed: number
  remaining: number
}

export default function BoppCalculatorPage() {
  const { formulas, loading: formulasLoading, fetchFormulas } = useBoppFormulas()
  const [selectedFormula, setSelectedFormula] = useState("")
  const [revenue, setRevenue] = useState("")
  const [calculation, setCalculation] = useState<BoppCalculation | null>(null)

  useEffect(() => {
    fetchFormulas()
  }, [])

  const calculate = () => {
    const rev = parseFloat(revenue) || 0
    const formula = formulas.find(f => f.id === selectedFormula)
    
    if (!formula) return

    const calc: BoppCalculation = {
      revenue: rev,
      marketing: rev * (formula.marketing_percent / 100),
      se: rev * (formula.se_percent / 100),
      management: rev * (formula.management_percent / 100),
      tech: rev * (formula.tech_percent / 100),
      operational: rev * (formula.operational_percent / 100),
      totalDistributed: 0,
      remaining: 0
    }

    calc.totalDistributed = calc.marketing + calc.se + calc.management + calc.tech + calc.operational
    calc.remaining = rev - calc.totalDistributed

    setCalculation(calc)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getFormula = () => formulas.find(f => f.id === selectedFormula)

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
          <Calculator className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Kalkulator BOPP</h1>
          <p className="text-slate-400">Hitung pembagian bonus berdasarkan formula</p>
        </div>
      </div>

      {/* Input Section */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Input Revenue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pilih Formula BOPP</Label>
              <select
                value={selectedFormula}
                onChange={(e) => setSelectedFormula(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
              >
                <option value="">Pilih formula...</option>
                {formulas.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Total Revenue (Rp)</Label>
              <Input
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="100000000"
                className="bg-slate-950 border-slate-800 text-slate-100"
              />
            </div>
          </div>

          <Button 
            onClick={calculate}
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={!selectedFormula || !revenue}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Hitung Distribusi
          </Button>
        </CardContent>
      </Card>

      {/* Formula Details */}
      {getFormula() && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100 text-sm">
              Formula: {getFormula()?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Marketing', value: getFormula()?.marketing_percent },
                { label: 'SE', value: getFormula()?.se_percent },
                { label: 'Management', value: getFormula()?.management_percent },
                { label: 'Tech', value: getFormula()?.tech_percent },
                { label: 'Operational', value: getFormula()?.operational_percent },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">{item.value}%</p>
                  <p className="text-sm text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {calculation && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-500" />
              Hasil Perhitungan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Total Revenue */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="text-3xl font-bold text-slate-100">
                {formatCurrency(calculation.revenue)}
              </p>
            </div>

            {/* Distribution Breakdown */}
            <div className="space-y-3">
              {[
                { label: 'Marketing', amount: calculation.marketing, color: 'bg-blue-500' },
                { label: 'Sales Engineer', amount: calculation.se, color: 'bg-purple-500' },
                { label: 'Management', amount: calculation.management, color: 'bg-amber-500' },
                { label: 'Tech Team', amount: calculation.tech, color: 'bg-emerald-500' },
                { label: 'Operational', amount: calculation.operational, color: 'bg-slate-500' },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-medium text-slate-100">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  <Progress 
                    value={(item.amount / calculation.revenue) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                <p className="text-sm text-emerald-400">Total Distribusi</p>
                <p className="text-xl font-bold text-emerald-300">
                  {formatCurrency(calculation.totalDistributed)}
                </p>
              </div>
              <div className="p-4 bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-500">Sisa (Net Profit)</p>
                <p className="text-xl font-bold text-slate-300">
                  {formatCurrency(calculation.remaining)}
                </p>
              </div>
            </div>

            {/* Alert */}
            {calculation.totalDistributed > calculation.revenue && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/30 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">
                  Total distribusi melebihi revenue! Periksa formula.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
