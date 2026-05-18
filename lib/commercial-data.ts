// ============================================================
// Commercial Module — Types, Static Data & Calculator Logic
// ============================================================

export interface RateCardEntry {
  type: string
  group: string
  role: string
  hpp: number
  specialRate: number
  publishRate: number
  isActive?: boolean
}

export interface ManpowerRow {
  id: string
  group: string
  role: string
  nama?: string
  qty: number
  months: number
  hppRate: number
  specialRate: number
  publishRate: number
}

export interface CalculatorRow extends ManpowerRow {
  selectedRoleIndex?: number
}

export interface Deductions {
  pajak: number
  founderFee: number
  managementFee: number
  seFee: number
}

export interface ToppAllocation {
  cogsPct: number
  opexPct: number
}

export interface ProjectInfo {
  projectName: string
  pic: string
  status: string
  type: string
}

export interface ProcurementItem {
  id: string
  itemName: string
  spesifikasi: string
  vendor: string
  link: string
  qty: number
  unitPrice: number
  total: number
  marginPct: number
  publishRate: number
}

export interface ProcurementSummary {
  items: ProcurementItem[]
  subtotal: number
  instalasiCost: number
  commissioningCost: number
  shippingCost: number
  totalPublish: number
  grandTotal: number
}

export function calculateProcurement(items: ProcurementItem[], instalasi: number, commissioning: number, shipping: number = 0): ProcurementSummary {
  const subtotal = items.reduce((s, i) => s + i.total, 0)
  const totalPublish = items.reduce((s, i) => s + i.publishRate, 0)
  return {
    items,
    subtotal,
    instalasiCost: instalasi,
    commissioningCost: commissioning,
    shippingCost: shipping,
    totalPublish,
    grandTotal: totalPublish + instalasi + commissioning + shipping,
  }
}

export function calcProcurementRow(qty: number, unitPrice: number): number {
  return qty * unitPrice
}

export interface SummaryResult {
  totalHpp: number
  totalPublish: number
  totalSpecial: number
  maxMonths: number
  totalDeductions: number
  salesProject: number
  profitPublish: number
  marginPublishPct: number
  profitActual: number
  marginActualPct: number
  variance: number
  variancePct: number
  cogsAmount: number
  opexAmount: number
  deductionPajak: number
  deductionFounderFee: number
  deductionManagementFee: number
  deductionSeFee: number
}

export interface MockProject {
  id: string
  projectCode: string
  projectName: string
  pic: string
  status: string
  type: string
  quotationPublish: number
  actualDeal: number
  deductions: Deductions
  topp: ToppAllocation
  manpower: ManpowerRow[]
  createdAt: string
}

// ============================================================
// Static RATE_CARD — 41 entries across 5 types
// ============================================================

export const RATE_CARD: RateCardEntry[] = [
  // Consultant — AA
  { type: 'Consultant', group: 'AA', role: 'Consultant Finance', hpp: 16775016, specialRate: 28014277, publishRate: 30530529 },
  { type: 'Consultant', group: 'AA', role: 'Consultant Strategic', hpp: 14166680, specialRate: 28014277, publishRate: 30530529 },
  { type: 'Consultant', group: 'AA', role: 'SAP Consultant', hpp: 17333345, specialRate: 28014277, publishRate: 30530529 },
  { type: 'Consultant', group: 'AA', role: 'IT Security Consultant', hpp: 15833350, specialRate: 28014277, publishRate: 30530529 },
  { type: 'Consultant', group: 'AA', role: 'Oracle Consultant', hpp: 15833350, specialRate: 28014277, publishRate: 30530529 },
  // Consultant — LA
  { type: 'Consultant', group: 'LA', role: 'System Analyst', hpp: 13333340, specialRate: 21000001, publishRate: 23100001 },
  { type: 'Consultant', group: 'LA', role: 'Data Analyst', hpp: 11666672, specialRate: 21000001, publishRate: 23100001 },
  { type: 'Consultant', group: 'LA', role: 'IT Auditor', hpp: 14166668, specialRate: 21000001, publishRate: 23100001 },
  { type: 'Consultant', group: 'LA', role: 'Technical Writer', hpp: 10833338, specialRate: 21000001, publishRate: 23100001 },
  // Consultant — JUN-PROJ
  { type: 'Consultant', group: 'JUN-PROJ', role: 'Junior Consultant', hpp: 8333336, specialRate: 12600001, publishRate: 13860001 },
  { type: 'Consultant', group: 'JUN-PROJ', role: 'Trainee Consultant', hpp: 5833334, specialRate: 8400000, publishRate: 9240000 },

  // Networking — JUN-NET
  { type: 'Networking', group: 'JUN-NET', role: 'Network Engineer L1', hpp: 8750000, specialRate: 13475000, publishRate: 14700001 },
  { type: 'Networking', group: 'JUN-NET', role: 'Network Engineer L2', hpp: 11250000, specialRate: 17325000, publishRate: 18900001 },
  { type: 'Networking', group: 'JUN-NET', role: 'NOC Operator', hpp: 7083332, specialRate: 10908333, publishRate: 11900001 },
  { type: 'Networking', group: 'JUN-NET', role: 'IT Support L1', hpp: 5833334, specialRate: 8983332, publishRate: 9800000 },
  // Networking — SR-NET
  { type: 'Networking', group: 'SR-NET', role: 'Network Engineer L3', hpp: 14583334, specialRate: 22458334, publishRate: 24500001 },
  { type: 'Networking', group: 'SR-NET', role: 'Network Architect', hpp: 18750000, specialRate: 28875000, publishRate: 31500001 },
  { type: 'Networking', group: 'SR-NET', role: 'Solution Architect', hpp: 20833334, specialRate: 32083334, publishRate: 35000001 },
  { type: 'Networking', group: 'SR-NET', role: 'Security Engineer', hpp: 16666668, specialRate: 25666668, publishRate: 28000001 },
  { type: 'Networking', group: 'SR-NET', role: 'Project Manager', hpp: 17500000, specialRate: 26950000, publishRate: 29400001 },

  // Project — JUN-PROJ-PRJ
  { type: 'Project', group: 'JUN-PROJ-PRJ', role: 'Junior Project Manager', hpp: 11250000, specialRate: 17325000, publishRate: 18900001 },
  { type: 'Project', group: 'JUN-PROJ-PRJ', role: 'Project Administrator', hpp: 8333336, specialRate: 12833336, publishRate: 14000001 },
  { type: 'Project', group: 'JUN-PROJ-PRJ', role: 'Junior Business Analyst', hpp: 10000000, specialRate: 15400000, publishRate: 16800001 },
  { type: 'Project', group: 'JUN-PROJ-PRJ', role: 'Documentation Specialist', hpp: 7083332, specialRate: 10908333, publishRate: 11900001 },
  { type: 'Project', group: 'JUN-PROJ-PRJ', role: 'Site Coordinator', hpp: 9166668, specialRate: 14116668, publishRate: 15400001 },
  // Project — SR-PROJ-PRJ
  { type: 'Project', group: 'SR-PROJ-PRJ', role: 'Senior Project Manager', hpp: 18750000, specialRate: 28875000, publishRate: 31500001 },
  { type: 'Project', group: 'SR-PROJ-PRJ', role: 'Program Manager', hpp: 20833334, specialRate: 32083334, publishRate: 35000001 },
  { type: 'Project', group: 'SR-PROJ-PRJ', role: 'IT Consultant Senior', hpp: 16666668, specialRate: 25666668, publishRate: 28000001 },
  { type: 'Project', group: 'SR-PROJ-PRJ', role: 'Senior Business Analyst', hpp: 14583334, specialRate: 22458334, publishRate: 24500001 },
  { type: 'Project', group: 'SR-PROJ-PRJ', role: 'Project Controller', hpp: 14166668, specialRate: 21816668, publishRate: 23800001 },

  // Web — WP
  { type: 'Web', group: 'WP', role: 'WordPress Developer', hpp: 8333336, specialRate: 12833336, publishRate: 14000001 },
  { type: 'Web', group: 'WP', role: 'WP Theme Developer', hpp: 10000000, specialRate: 15400000, publishRate: 16800001 },
  { type: 'Web', group: 'WP', role: 'WP Plugin Developer', hpp: 11250000, specialRate: 17325000, publishRate: 18900001 },
  // Web — FES
  { type: 'Web', group: 'FES', role: 'Frontend Developer', hpp: 10416668, specialRate: 16041668, publishRate: 17500001 },
  { type: 'Web', group: 'FES', role: 'React Developer', hpp: 12500000, specialRate: 19250000, publishRate: 21000001 },
  { type: 'Web', group: 'FES', role: 'Vue Developer', hpp: 11250000, specialRate: 17325000, publishRate: 18900001 },
  { type: 'Web', group: 'FES', role: 'UI/UX Designer', hpp: 10416668, specialRate: 16041668, publishRate: 17500001 },
  // Web — BE
  { type: 'Web', group: 'BE', role: 'Backend Developer', hpp: 12500000, specialRate: 19250000, publishRate: 21000001 },
  { type: 'Web', group: 'BE', role: 'Full Stack Developer', hpp: 14583334, specialRate: 22458334, publishRate: 24500001 },
  { type: 'Web', group: 'BE', role: 'Node.js Developer', hpp: 12500000, specialRate: 19250000, publishRate: 21000001 },
  { type: 'Web', group: 'BE', role: 'Database Engineer DBA', hpp: 14166668, specialRate: 21816668, publishRate: 23800001 },

  // WMS
  { type: 'WMS', group: 'WMS', role: 'WMS Consultant', hpp: 14583334, specialRate: 22458334, publishRate: 24500001 },
  { type: 'WMS', group: 'WMS', role: 'WMS Implementator', hpp: 12500000, specialRate: 19250000, publishRate: 21000001 },
  { type: 'WMS', group: 'WMS', role: 'WMS Developer', hpp: 11250000, specialRate: 17325000, publishRate: 18900001 },
  { type: 'WMS', group: 'WMS', role: 'WMS Support', hpp: 9166668, specialRate: 14116668, publishRate: 15400001 },
]

// ============================================================
// DB Fetch Helpers (with static fallback)
// ============================================================

import { insForge } from "./insforge"

/** Fetch rate cards from DB, fallback to static data */
export async function fetchRateCards(): Promise<RateCardEntry[]> {
  if (!insForge) return RATE_CARD
  try {
    const { data, error } = await insForge
      .from("commercial_rate_cards")
      .select("project_type, group_name, role_name, hpp_rate, publish_rate, special_rate, is_active")
      .order("project_type")
      .order("group_name")
      .order("role_name")
    if (error || !data || data.length === 0) return RATE_CARD
    return data.map((r: any) => ({
      type: r.project_type,
      group: r.group_name,
      role: r.role_name,
      hpp: Number(r.hpp_rate) || 0,
      specialRate: Number(r.special_rate) || 0,
      publishRate: Number(r.publish_rate) || 0,
      isActive: r.is_active !== false,
    }))
  } catch {
    return RATE_CARD
  }
}

interface DbProject {
  id: string; project_code: string; project_name: string; client_name: string | null
  status: string; health: string; total_hpp: number; total_publish: number
  grand_total: number; margin_pct: number; deductions_data: any; topp_data: any
  quotation_publish: number; actual_deal: number; lead_id: string | null
  notes: string | null; created_at: string; updated_at: string
}
interface DbManpower {
  id: string; project_id: string; role_name: string; qty: number; months: number
  hpp_rate: number; publish_rate: number; special_rate: number; sort_order: number
}

/** Fetch projects from DB, fallback to static data */
export async function fetchProjects(): Promise<MockProject[]> {
  if (!insForge) return [...MOCK_PROJECTS]
  try {
    const { data: projects, error } = await insForge
      .from("commercial_projects")
      .select("id, project_code, project_name, client_name, project_type, status, total_hpp, total_publish, quotation_publish, actual_deal, deductions_data, topp_data, notes, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
    if (error || !projects) return [...MOCK_PROJECTS]

    return await Promise.all(projects.map(async (p: any) => {
      // Fetch manpower for this project
      const { data: manpower } = await insForge!
        .from("commercial_project_manpower")
        .select("*")
        .eq("project_id", p.id)
        .order("sort_order")

      return {
        id: p.id,
        projectCode: p.project_code,
        projectName: p.project_name,
        pic: p.client_name || "",
        status: p.status,
        type: p.project_type || "Consultant",
        quotationPublish: Number(p.quotation_publish) || 0,
        actualDeal: Number(p.actual_deal) || 0,
        deductions: p.deductions_data || { pajak: 11, founderFee: 3, managementFee: 2, seFee: 0 },
        topp: p.topp_data || { cogsPct: 25, opexPct: 75 },
        manpower: (manpower || []).map((m: any) => ({
          id: m.id, group: "", role: m.role_name, nama: "",
          qty: m.qty, months: m.months,
          hppRate: Number(m.hpp_rate) || 0,
          specialRate: Number(m.special_rate) || 0,
          publishRate: Number(m.publish_rate) || 0,
        })),
        createdAt: p.created_at?.slice(0, 10) || "",
      }
    }))
  } catch {
    return [...MOCK_PROJECTS]
  }
}

const fmtIDR_global = (n: number) => {
  if (n === 0) return "IDR 0"
  return "IDR " + Math.abs(n).toLocaleString("id-ID")
}

// ============================================================
// Utility Functions
// ============================================================

let idCounter = 0
export function generateRowId(): string {
  return `row_${++idCounter}_${Date.now()}`
}

export function resetIdCounter() {
  idCounter = 0
}

export function fmtIDR(n: number): string {
  if (n === 0) return 'IDR 0'
  const abs = Math.abs(n)
  const formatted = abs.toLocaleString('id-ID')
  return `IDR ${formatted}`
}

export function parseIDR(text: string): number {
  if (!text.trim()) return 0
  const cleaned = text.replace(/[^0-9,-]/g, '').replace(/\./g, '').replace(',', '.')
  const val = parseFloat(cleaned)
  return isNaN(val) ? NaN : val
}

export function pct(n: number): string {
  if (n === 0) return '0%'
  return `${n.toFixed(1)}%`
}

export function getGroups(type: string): string[] {
  const groups = new Set<string>()
  for (const rc of RATE_CARD) {
    if (rc.type === type) groups.add(rc.group)
  }
  return Array.from(groups)
}

export function getRoles(type: string, group: string): RateCardEntry[] {
  return RATE_CARD.filter((rc) => rc.type === type && rc.group === group)
}

export function getRoleEntry(type: string, group: string, role: string): RateCardEntry | undefined {
  return RATE_CARD.find((rc) => rc.type === type && rc.group === group && rc.role === role)
}

export function getEntryByIndex(index: number): RateCardEntry | undefined {
  return RATE_CARD[index]
}

export function calcRow(entry: RateCardEntry, qty: number, months: number) {
  return {
    hpp: entry.hpp * qty * months,
    publish: entry.publishRate * qty * months,
    special: entry.specialRate * qty * months,
  }
}

export function getDeductions(total: number, d: Deductions) {
  const pajak = total * (d.pajak / 100)
  const founderFee = total * (d.founderFee / 100)
  const managementFee = total * (d.managementFee / 100)
  const seFee = total * (d.seFee / 100)
  return {
    pajakAmount: pajak,
    founderFeeAmount: founderFee,
    managementFeeAmount: managementFee,
    seFeeAmount: seFee,
    totalDeductions: pajak + founderFee + managementFee + seFee,
  }
}

export function calculateSummary(
  rows: ManpowerRow[],
  d: Deductions,
  topp: ToppAllocation,
  quotation: number,
  actual: number,
): SummaryResult {
  const totalPublish = rows.reduce((sum, r) => sum + r.publishRate * r.qty * r.months, 0)
  const totalHpp = rows.reduce((sum, r) => sum + r.hppRate * r.qty * r.months, 0)
  const totalSpecial = rows.reduce((sum, r) => sum + r.specialRate * r.qty * r.months, 0)
  const maxMonths = rows.reduce((max, r) => Math.max(max, r.months), 0)

  const deductionCalc = getDeductions(totalPublish, d)
  const salesProject = totalPublish - deductionCalc.totalDeductions
  const profitPublish = totalPublish - totalHpp
  const marginPublishPct = totalPublish > 0 ? (profitPublish / totalPublish) * 100 : 0
  const profitActual = actual - totalHpp
  const marginActualPct = actual > 0 ? (profitActual / actual) * 100 : 0
  const variance = quotation - actual
  const variancePct = quotation > 0 ? (variance / quotation) * 100 : 0

  const afterDeductions = totalPublish - deductionCalc.totalDeductions
  const cogsAmount = afterDeductions * (topp.cogsPct / 100)
  const opexAmount = afterDeductions * (topp.opexPct / 100)

  return {
    totalHpp,
    totalPublish,
    totalSpecial,
    maxMonths,
    totalDeductions: deductionCalc.totalDeductions,
    salesProject,
    profitPublish,
    marginPublishPct,
    profitActual: Math.max(profitActual, 0),
    marginActualPct,
    variance,
    variancePct,
    cogsAmount,
    opexAmount,
    deductionPajak: deductionCalc.pajakAmount,
    deductionFounderFee: deductionCalc.founderFeeAmount,
    deductionManagementFee: deductionCalc.managementFeeAmount,
    deductionSeFee: deductionCalc.seFeeAmount,
  }
}

// ============================================================
// Mock Projects (for Phase 1 prototype)
// ============================================================

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: 'proj-1', projectCode: 'CMP-2026-0001', projectName: 'ERP Implementation Bank Mandiri', pic: 'Fitri H',
    status: 'Won', type: 'Consultant', quotationPublish: 1500000000, actualDeal: 1350000000,
    deductions: { pajak: 11, founderFee: 3, managementFee: 2, seFee: 0 },
    topp: { cogsPct: 25, opexPct: 75 },
    manpower: [
      { id: 'mp-1', group: 'AA', role: 'Consultant Finance', qty: 2, months: 12, hppRate: 16775016, specialRate: 28014277, publishRate: 30530529 },
      { id: 'mp-2', group: 'LA', role: 'System Analyst', qty: 1, months: 12, hppRate: 13333340, specialRate: 21000001, publishRate: 23100001 },
    ],
    createdAt: '2026-01-15',
  },
  {
    id: 'proj-2', projectCode: 'CMP-2026-0002', projectName: 'Network Infrastructure Telkom', pic: 'Rudi H',
    status: 'Delivery', type: 'Networking', quotationPublish: 800000000, actualDeal: 750000000,
    deductions: { pajak: 11, founderFee: 3, managementFee: 2, seFee: 0 },
    topp: { cogsPct: 25, opexPct: 75 },
    manpower: [
      { id: 'mp-3', group: 'SR-NET', role: 'Network Architect', qty: 1, months: 6, hppRate: 18750000, specialRate: 28875000, publishRate: 31500001 },
      { id: 'mp-4', group: 'JUN-NET', role: 'Network Engineer L2', qty: 2, months: 6, hppRate: 11250000, specialRate: 17325000, publishRate: 18900001 },
    ],
    createdAt: '2026-02-01',
  },
  {
    id: 'proj-3', projectCode: 'CMP-2026-0003', projectName: 'Website Company Profile Gojek', pic: 'Dian P',
    status: 'Negotiation', type: 'Web', quotationPublish: 200000000, actualDeal: 180000000,
    deductions: { pajak: 11, founderFee: 3, managementFee: 2, seFee: 0 },
    topp: { cogsPct: 25, opexPct: 75 },
    manpower: [
      { id: 'mp-5', group: 'FES', role: 'Frontend Developer', qty: 1, months: 3, hppRate: 10416668, specialRate: 16041668, publishRate: 17500001 },
      { id: 'mp-6', group: 'BE', role: 'Backend Developer', qty: 1, months: 3, hppRate: 12500000, specialRate: 19250000, publishRate: 21000001 },
      { id: 'mp-7', group: 'WP', role: 'WordPress Developer', qty: 1, months: 2, hppRate: 8333336, specialRate: 12833336, publishRate: 14000001 },
    ],
    createdAt: '2026-02-20',
  },
  {
    id: 'proj-4', projectCode: 'CMP-2026-0004', projectName: 'WMS Implementation Gudang XYZ', pic: 'Andi P',
    status: 'Draft', type: 'WMS', quotationPublish: 500000000, actualDeal: 0,
    deductions: { pajak: 11, founderFee: 3, managementFee: 2, seFee: 0 },
    topp: { cogsPct: 25, opexPct: 75 },
    manpower: [
      { id: 'mp-8', group: 'WMS', role: 'WMS Consultant', qty: 1, months: 6, hppRate: 14583334, specialRate: 22458334, publishRate: 24500001 },
      { id: 'mp-9', group: 'WMS', role: 'WMS Implementator', qty: 2, months: 6, hppRate: 12500000, specialRate: 19250000, publishRate: 21000001 },
    ],
    createdAt: '2026-03-05',
  },
  {
    id: 'proj-5', projectCode: 'CMP-2026-0005', projectName: 'Mobile App Development Tokopedia', pic: 'Fitri H',
    status: 'Submitted', type: 'Web', quotationPublish: 650000000, actualDeal: 0,
    deductions: { pajak: 11, founderFee: 3, managementFee: 2, seFee: 0 },
    topp: { cogsPct: 25, opexPct: 75 },
    manpower: [
      { id: 'mp-10', group: 'FES', role: 'React Developer', qty: 2, months: 4, hppRate: 12500000, specialRate: 19250000, publishRate: 21000001 },
      { id: 'mp-11', group: 'BE', role: 'Full Stack Developer', qty: 1, months: 4, hppRate: 14583334, specialRate: 22458334, publishRate: 24500001 },
    ],
    createdAt: '2026-03-15',
  },
  {
    id: 'proj-6', projectCode: 'CMP-2026-0006', projectName: 'IT Audit Consulting BCA', pic: 'Siti R',
    status: 'Won', type: 'Consultant', quotationPublish: 350000000, actualDeal: 320000000,
    deductions: { pajak: 11, founderFee: 3, managementFee: 2, seFee: 0 },
    topp: { cogsPct: 25, opexPct: 75 },
    manpower: [
      { id: 'mp-12', group: 'LA', role: 'IT Auditor', qty: 2, months: 3, hppRate: 14166668, specialRate: 21000001, publishRate: 23100001 },
    ],
    createdAt: '2026-04-01',
  },
  {
    id: 'proj-7', projectCode: 'CMP-2026-0007', projectName: 'PMO Support Project Garuda', pic: 'Fitri H',
    status: 'Lost', type: 'Project', quotationPublish: 400000000, actualDeal: 0,
    deductions: { pajak: 11, founderFee: 3, managementFee: 2, seFee: 0 },
    topp: { cogsPct: 25, opexPct: 75 },
    manpower: [
      { id: 'mp-13', group: 'SR-PROJ-PRJ', role: 'Senior Project Manager', qty: 1, months: 6, hppRate: 18750000, specialRate: 28875000, publishRate: 31500001 },
      { id: 'mp-14', group: 'JUN-PROJ-PRJ', role: 'Project Administrator', qty: 1, months: 6, hppRate: 8333336, specialRate: 12833336, publishRate: 14000001 },
    ],
    createdAt: '2026-04-10',
  },
  {
    id: 'proj-8', projectCode: 'CMP-2026-0008', projectName: 'Network Security Upgrade BNI', pic: 'Rudi H',
    status: 'On Hold', type: 'Networking', quotationPublish: 600000000, actualDeal: 0,
    deductions: { pajak: 11, founderFee: 3, managementFee: 2, seFee: 0 },
    topp: { cogsPct: 25, opexPct: 75 },
    manpower: [
      { id: 'mp-15', group: 'SR-NET', role: 'Security Engineer', qty: 1, months: 4, hppRate: 16666668, specialRate: 25666668, publishRate: 28000001 },
      { id: 'mp-16', group: 'JUN-NET', role: 'Network Engineer L1', qty: 2, months: 4, hppRate: 8750000, specialRate: 13475000, publishRate: 14700001 },
    ],
    createdAt: '2026-04-20',
  },
]

export function getProjectById(id: string): MockProject | undefined {
  return MOCK_PROJECTS.find((p) => p.id === id)
}
