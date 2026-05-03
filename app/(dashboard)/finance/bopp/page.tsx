"use client"

import { useState } from "react"
import { Calculator, TrendingUp, Save, History, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { useBoppFormulas } from "@/hooks/useBoppFormulas"

export default function BoppCalculatorPage() {
  const [revenue, setRevenue] = useState("")
  const [selectedFormula, setSelectedFormula] = useState("")
  const [calculation, setCalculation] = useState<{
    total: number
    breakdown: { name: string; percentage: number; amount: number }[]
  } | null>(null)

  const { formulas, loading } = useBoppFormulas()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleCalculate = () => {
    const total = parseFloat(revenue.replace(/[^0-9]/g, "")) || 0
    const formula = formulas.find((f: any) => f.id === selectedFormula)

    if (!formula || total === 0) return

    const breakdown = [
      { name: "Marketing", percentage: formula.marketing_percent, amount: (total * formula.marketing_percent) / 100 },
      { name: "SE", percentage: formula.se_percent, amount: (total * formula.se_percent) / 100 },
      { name: "Management", percentage: formula.management_percent, amount: (total * formula.management_percent) / 100 },
      { name: "Tech", percentage: formula.tech_percent, amount: (total * formula.tech_percent) / 100 },
      { name: "Operational", percentage: formula.operational_percent, amount: (total * formula.operational_percent) / 100 },
    ].filter(b => b.percentage > 0)

    setCalculation({ total, breakdown })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">BOPP Calculator</h1>
          <p className="text-slate-400 mt-1">Calculate profit distribution per BOPP formula</p>
        </div>
        <Button variant="outline" className="border-slate-700">
          <History className="w-4 h-4 mr-2" />
          View History
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Calculation Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Total Revenue</Label>
              <Input
                placeholder="Enter amount (e.g. 1000000000)"
                value={revenue}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "")
                  setRevenue(val ? parseInt(val).toLocaleString("id-ID") : "")
                }}
                className="bg-slate-800 border-slate-700 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">BOPP Formula</Label>
              <Select value={selectedFormula} onValueChange={setSelectedFormula}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder={loading ? "Loading..." : "Select formula"} />
                </SelectTrigger>
                <SelectContent>
                  {formulas.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>
                      <div>
                        <p className="font-medium">{f.name}</p>
                        <p className="text-xs text-slate-500">{f.description || 'No description'}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={handleCalculate}
              disabled={!revenue || !selectedFormula || loading}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Calculate Distribution
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-100">Distribution Result</CardTitle>
              <CardDescription className="text-slate-400">
                {calculation ? `Based on ${formatCurrency(calculation.total)} revenue` : "Enter revenue to calculate"}
              </CardDescription>
            </div>
            {calculation && (
              <Button variant="outline" size="sm" className="border-slate-700">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {calculation ? (
              <div className="space-y-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-400">Category</TableHead>
                      <TableHead className="text-slate-400 text-right">Percentage</TableHead>
                      <TableHead className="text-slate-400 text-right">Amount</TableHead>
                      <TableHead className="text-slate-400">Visual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculation.breakdown.map((cat) => (
                      <TableRow key={cat.name} className="border-slate-700">
                        <TableCell className="font-medium text-slate-200">{cat.name}</TableCell>
                        <TableCell className="text-right text-slate-300">{cat.percentage}%</TableCell>
                        <TableCell className="text-right font-mono text-slate-300">
                          {formatCurrency(cat.amount)}
                        </TableCell>
                        <TableCell className="w-32">
                          <Progress value={cat.percentage} className="h-2 bg-slate-800" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total Distributed</span>
                    <span className="text-xl font-bold text-emerald-400">
                      {formatCurrency(calculation.total)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Enter revenue and select formula to see distribution</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
