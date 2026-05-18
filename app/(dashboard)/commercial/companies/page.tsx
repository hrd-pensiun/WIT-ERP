"use client"

import { useState, useEffect } from "react"
import { Building2, Plus, Search, MapPin, Globe, Edit3, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FilterBar, FilterBarSearch } from "@/components/ui/filter-bar"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

interface Company {
  name: string
  total_clients: number
  latest_lead?: string
}

export default function CompanyManagementPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const fetchCompanies = async () => {
    if (!insForge) return
    try {
      const { data, error } = await insForge
        .from("crm_leads")
        .select("company_name, contact_name, created_at")
        .eq("tenant_id", getTenantId())
        .not("company_name", "is", null)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Group by company name
      const map = new Map<string, { count: number; latest: string }>()
      ;(data || []).forEach((row: any) => {
        const existing = map.get(row.company_name)
        if (existing) {
          existing.count++
        } else {
          map.set(row.company_name, {
            count: 1,
            latest: row.contact_name || "-",
          })
        }
      })

      setCompanies(
        Array.from(map.entries())
          .map(([name, info]) => ({
            name,
            total_clients: info.count,
            latest_lead: info.latest,
          }))
          .sort((a, b) => b.total_clients - a.total_clients)
      )
    } catch (err) {
      console.error("Failed to fetch companies:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  const filtered = companies.filter(
    (c) =>
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-500" />
            Manajemen Perusahaan
          </h1>
          <p className="text-muted-foreground mt-1">Daftar perusahaan klien</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Perusahaan
        </Button>
      </div>

      <FilterBar>
        <FilterBarSearch
          placeholder="Cari perusahaan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </FilterBar>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Nama Perusahaan</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Jumlah Klien</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground hidden md:table-cell">Kontak Terakhir</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-sm text-muted-foreground">
                      Memuat data...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-sm text-muted-foreground">
                      {search ? "Tidak ada hasil." : "Belum ada perusahaan."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((company) => (
                    <tr key={company.name} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{company.name}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground hidden sm:table-cell">
                        {company.total_clients} klien
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground hidden md:table-cell">
                        {company.latest_lead}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center gap-0.5 justify-end">
                          <button className="p-1.5 rounded text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
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
    </div>
  )
}
