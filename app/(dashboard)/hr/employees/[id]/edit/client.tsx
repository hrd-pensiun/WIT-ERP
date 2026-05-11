"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Plus, Save, Trash2, User, UserCircle, Briefcase, Users, GraduationCap, TrendingUp, FolderOpen, Pencil, History, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useEmployees } from "@/hooks/useEmployees"
import { useEmployeeProfileDetails } from "@/hooks/useEmployeeProfileDetails"
import { useDepartments } from "@/hooks/useDepartments"
import { useDivisions } from "@/hooks/useDivisions"
import { usePositions } from "@/hooks/usePositions"
import { useJobGrades } from "@/hooks/useJobGrades"
import { useAuth } from "@/hooks/useAuth"
import { useEmployeeCompensation, SALARY_REASONS } from "@/hooks/useEmployeeCompensation"
import { useSalaryComponents } from "@/hooks/useSalaryComponents"

const DEPARTMENT_OPTIONAL_MIN_LEVEL = 9

type FamilyMember = {
  name: string
  relation: string
  phone: string
  birth_date: string
  dependent_for_tax: boolean
  notes: string
}

type EducationHistory = {
  level: string
  institution: string
  major: string
  start_year: string
  end_year: string
  gpa: string
  notes: string
}

type InformalEducation = {
  name: string
  provider: string
  year: string
  certificate: string
  notes: string
}

type OrganizationExperience = {
  organization: string
  role: string
  start_year: string
  end_year: string
  notes: string
}

type WorkHistory = {
  company: string
  position: string
  start_date: string
  end_date: string
  reason_for_leaving: string
  notes: string
}

type PortfolioItem = {
  title: string
  role: string
  year: string
  url: string
  description: string
}

const EMPTY_FAMILY_MEMBER: FamilyMember = {
  name: "",
  relation: "",
  phone: "",
  birth_date: "",
  dependent_for_tax: false,
  notes: "",
}

const EMPTY_EDUCATION_HISTORY: EducationHistory = {
  level: "",
  institution: "",
  major: "",
  start_year: "",
  end_year: "",
  gpa: "",
  notes: "",
}

const EMPTY_INFORMAL_EDUCATION: InformalEducation = {
  name: "",
  provider: "",
  year: "",
  certificate: "",
  notes: "",
}

const EMPTY_ORGANIZATION_EXPERIENCE: OrganizationExperience = {
  organization: "",
  role: "",
  start_year: "",
  end_year: "",
  notes: "",
}

const EMPTY_WORK_HISTORY: WorkHistory = {
  company: "",
  position: "",
  start_date: "",
  end_date: "",
  reason_for_leaving: "",
  notes: "",
}

const EMPTY_PORTFOLIO_ITEM: PortfolioItem = {
  title: "",
  role: "",
  year: "",
  url: "",
  description: "",
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)
}

export default function EmployeeEditClient({ id }: { id: string }) {
  const router = useRouter()
  const { hasRole } = useAuth()
  const isAdmin = hasRole(["hr_admin", "SuperAdmin"])
  const { employees, update, loading: hookLoading, fetchEmployees } = useEmployees()
  const { departments } = useDepartments()
  const { divisions } = useDivisions()
  const { positions } = usePositions()
  const { jobGrades } = useJobGrades()
  const { getProfileDetails, replaceProfileDetails } = useEmployeeProfileDetails()
  const { salaryHistory, allowances: compAllowances, currentSalary, loading: compLoading, addSalaryEntry, addAllowance, updateAllowance, deleteAllowance, fetchAllowanceHistory } = useEmployeeCompensation(id)
  const { components: salaryComponents } = useSalaryComponents()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("personal")

  // Salary dialog
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false)
  const [salaryForm, setSalaryForm] = useState({ amount: "", effective_date: "", reason: "", reason_other: "", notes: "" })
  const [salarySubmitting, setSalarySubmitting] = useState(false)

  // Allowance dialog
  const BLANK_ALLOWANCE = { salary_component_id: "", amount: "", effective_date: "", reason: "", reason_other: "", notes: "" }
  const [allowanceDialogOpen, setAllowanceDialogOpen] = useState(false)
  const [editingAllowanceId, setEditingAllowanceId] = useState<string | null>(null)
  const [allowanceForm, setAllowanceForm] = useState(BLANK_ALLOWANCE)
  const [allowanceSubmitting, setAllowanceSubmitting] = useState(false)

  // History modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [historyItems, setHistoryItems] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyTitle, setHistoryTitle] = useState("")

  const openAddAllowance = () => { setEditingAllowanceId(null); setAllowanceForm(BLANK_ALLOWANCE); setAllowanceDialogOpen(true) }
  const openEditAllowance = (a: any) => {
    setEditingAllowanceId(a.id)
    setAllowanceForm({ salary_component_id: a.salary_component_id, amount: String(a.amount), effective_date: a.effective_date || "", reason: "", reason_other: "", notes: a.notes || "" })
    setAllowanceDialogOpen(true)
  }
  const openHistory = async (allowanceId: string, name: string) => {
    setHistoryTitle(name); setHistoryModalOpen(true); setHistoryLoading(true)
    setHistoryItems(await fetchAllowanceHistory(allowanceId))
    setHistoryLoading(false)
  }
  const handleSalarySave = async () => {
    setSalarySubmitting(true)
    try {
      await addSalaryEntry({ amount: Number(salaryForm.amount), effective_date: salaryForm.effective_date, reason: salaryForm.reason || undefined, reason_other: salaryForm.reason === "other" ? salaryForm.reason_other : undefined, notes: salaryForm.notes || undefined })
      setSalaryDialogOpen(false)
    } finally { setSalarySubmitting(false) }
  }
  const handleAllowanceSave = async () => {
    setAllowanceSubmitting(true)
    try {
      const reason = allowanceForm.reason || undefined
      const reason_other = allowanceForm.reason === "other" ? allowanceForm.reason_other : undefined
      if (editingAllowanceId) {
        await updateAllowance(editingAllowanceId, { amount: Number(allowanceForm.amount), effective_date: allowanceForm.effective_date, reason, reason_other, notes: allowanceForm.notes || undefined })
      } else {
        await addAllowance({ salary_component_id: allowanceForm.salary_component_id, amount: Number(allowanceForm.amount), effective_date: allowanceForm.effective_date || new Date().toISOString().slice(0, 10), reason, reason_other, notes: allowanceForm.notes || undefined })
      }
      setAllowanceDialogOpen(false)
    } finally { setAllowanceSubmitting(false) }
  }
  const handleDeleteAllowance = async (a: any) => {
    if (!confirm(`Hapus tunjangan "${(a as any).salary_components?.name}"?`)) return
    await deleteAllowance(a.id)
  }
  const reasonLabel = (r: string) => SALARY_REASONS.find((x) => x.value === r)?.label || r
  const [rawDocuments, setRawDocuments] = useState<Record<string, unknown>>({})
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { ...EMPTY_FAMILY_MEMBER },
  ])
  const [educationHistories, setEducationHistories] = useState<EducationHistory[]>([
    { ...EMPTY_EDUCATION_HISTORY },
  ])
  const [informalEducations, setInformalEducations] = useState<InformalEducation[]>([
    { ...EMPTY_INFORMAL_EDUCATION },
  ])
  const [organizationExperiences, setOrganizationExperiences] = useState<
    OrganizationExperience[]
  >([{ ...EMPTY_ORGANIZATION_EXPERIENCE }])
  const [workHistories, setWorkHistories] = useState<WorkHistory[]>([
    { ...EMPTY_WORK_HISTORY },
  ])
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([
    { ...EMPTY_PORTFOLIO_ITEM },
  ])
  const [formData, setFormData] = useState({
    full_name: "",
    employee_number: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    religion: "",
    marital_status: "",
    address: "",
    city: "",
    department_id: "",
    reports_to_profile_id: "",
    division_id: "",
    position_id: "",
    job_grade_id: "",
    employment_type: "permanent",
    app_role: "employee",
    status: "active",
    join_date: "",
    end_date: "",
    probation_end_date: "",
    npwp: "",
    bpjs_tk_number: "",
    bpjs_kes_number: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    ptkp_status: "TK/0",
    tax_position: "staff",
  })

  const selectedGradeLevel = useMemo(() => {
    const byGrade = jobGrades.find((g) => String(g.id) === formData.job_grade_id)
    if (byGrade?.level != null && Number.isFinite(Number(byGrade.level))) {
      return Number(byGrade.level)
    }
    const byPosition = positions.find((p) => String(p.id) === formData.position_id) as
      | (Record<string, unknown> & { hr_job_grades?: { level?: number | null } | null })
      | undefined
    const lvl = byPosition?.hr_job_grades?.level
    return lvl != null && Number.isFinite(Number(lvl)) ? Number(lvl) : null
  }, [formData.job_grade_id, formData.position_id, jobGrades, positions])

  const eligibleManagers = useMemo(() => {
    return employees.filter((emp) => {
      if (emp.status !== "active" || emp.id === id) return false
      const managerLevel = (emp as any)?.hr_job_grades?.level
      if (managerLevel == null || selectedGradeLevel == null) return false
      return Number(managerLevel) > selectedGradeLevel
    })
  }, [employees, id, selectedGradeLevel])

  useEffect(() => {
    if (!formData.reports_to_profile_id) return
    const stillEligible = eligibleManagers.some((emp) => emp.id === formData.reports_to_profile_id)
    if (!stillEligible) {
      setFormData((prev) => ({ ...prev, reports_to_profile_id: "" }))
    }
  }, [eligibleManagers, formData.reports_to_profile_id])

  useEffect(() => {
    const emp = employees.find((e) => e.id === id)
    if (emp) {
      let cancelled = false
      const loadDetails = async () => {
      const docs = (emp.documents && typeof emp.documents === "object" ? emp.documents : {}) as Record<string, unknown>
      const tax = (docs.tax && typeof docs.tax === "object" ? docs.tax : {}) as Record<string, unknown>
      const legacyFamily = (docs.family && typeof docs.family === "object" ? docs.family : {}) as Record<string, unknown>
      const legacyEducation = (docs.education && typeof docs.education === "object" ? docs.education : {}) as Record<string, unknown>

      const storedFamily = Array.isArray(docs.family_history)
        ? (docs.family_history as Record<string, unknown>[])
            .map((item) => ({
              name: String(item.name || ""),
              relation: String(item.relation || ""),
              phone: String(item.phone || ""),
              birth_date: String(item.birth_date || ""),
              dependent_for_tax: Boolean(item.dependent_for_tax),
              notes: String(item.notes || ""),
            }))
            .filter((item) => item.name || item.relation || item.phone)
        : []

      const storedEducation = Array.isArray(docs.education_history)
        ? (docs.education_history as Record<string, unknown>[])
            .map((item) => ({
              level: String(item.level || ""),
              institution: String(item.institution || ""),
              major: String(item.major || ""),
              start_year: String(item.start_year || ""),
              end_year: String(item.end_year || ""),
              gpa: String(item.gpa || ""),
              notes: String(item.notes || ""),
            }))
            .filter((item) => item.level || item.institution || item.major)
        : []

      const storedInformalEducation = Array.isArray(docs.informal_education_history)
        ? (docs.informal_education_history as Record<string, unknown>[])
            .map((item) => ({
              name: String(item.name || ""),
              provider: String(item.provider || ""),
              year: String(item.year || ""),
              certificate: String(item.certificate || ""),
              notes: String(item.notes || ""),
            }))
            .filter((item) => item.name || item.provider)
        : []

      const storedOrganizationExperience = Array.isArray(docs.organization_experience_history)
        ? (docs.organization_experience_history as Record<string, unknown>[])
            .map((item) => ({
              organization: String(item.organization || ""),
              role: String(item.role || ""),
              start_year: String(item.start_year || ""),
              end_year: String(item.end_year || ""),
              notes: String(item.notes || ""),
            }))
            .filter((item) => item.organization || item.role)
        : []

      const storedWorkHistory = Array.isArray(docs.work_history)
        ? (docs.work_history as Record<string, unknown>[])
            .map((item) => ({
              company: String(item.company || ""),
              position: String(item.position || ""),
              start_date: String(item.start_date || ""),
              end_date: String(item.end_date || ""),
              reason_for_leaving: String(item.reason_for_leaving || ""),
              notes: String(item.notes || ""),
            }))
            .filter((item) => item.company || item.position)
        : []

      const storedPortfolio = Array.isArray(docs.portfolio)
        ? (docs.portfolio as Record<string, unknown>[])
            .map((item) => ({
              title: String(item.title || ""),
              role: String(item.role || ""),
              year: String(item.year || ""),
              url: String(item.url || ""),
              description: String(item.description || ""),
            }))
            .filter((item) => item.title || item.url)
        : []

      setFormData({
        full_name: emp.full_name || "",
        employee_number: emp.employee_number || "",
        email: emp.email || "",
        phone: emp.phone || "",
        date_of_birth: emp.date_of_birth || "",
        gender: emp.gender || "",
        religion: emp.religion || "",
        marital_status: emp.marital_status || "",
        address: emp.address || "",
        city: emp.city || "",
        department_id: emp.department_id || "",
        reports_to_profile_id: (emp as any).reports_to_profile_id || "",
        division_id: emp.division_id || "",
        position_id: emp.position_id || "",
        job_grade_id: emp.job_grade_id || "",
        employment_type: emp.employment_type || "permanent",
        app_role: (emp as any).app_role || "employee",
        status: emp.status || "active",
        join_date: emp.join_date || "",
        end_date: emp.end_date || "",
        probation_end_date: emp.probation_end_date || "",
        npwp: emp.npwp || "",
        bpjs_tk_number: emp.bpjs_tk_number || "",
        bpjs_kes_number: emp.bpjs_kes_number || "",
        bank_name: emp.bank_name || "",
        bank_account_number: emp.bank_account_number || "",
        bank_account_name: emp.bank_account_name || "",
        emergency_contact_name: emp.emergency_contact_name || "",
        emergency_contact_phone: emp.emergency_contact_phone || "",
        ptkp_status: String((emp as any).ptkp_status || tax.ptkp_status || "TK/0"),
        tax_position: String((emp as any).tax_position || tax.position || "staff"),
      })

      setRawDocuments(docs)
      try {
        const detail = await getProfileDetails(id)
        if (cancelled) return
        setFamilyMembers(
          detail.familyMembers.length > 0
            ? detail.familyMembers.map((item: any) => ({
                name: String(item.name || ""),
                relation: String(item.relation || ""),
                phone: String(item.phone || ""),
                birth_date: String(item.birth_date || ""),
                dependent_for_tax: Boolean(item.dependent_for_tax),
                notes: String(item.notes || ""),
              }))
            : storedFamily.length > 0
              ? storedFamily
              : [
                  {
                    name: String(legacyFamily.spouse_name || ""),
                    relation: legacyFamily.spouse_name ? "pasangan" : "",
                    phone: String(legacyFamily.spouse_phone || ""),
                    birth_date: "",
                    dependent_for_tax: Boolean(
                      legacyFamily.children_count &&
                        Number(legacyFamily.children_count) > 0
                    ),
                    notes: String(legacyFamily.notes || ""),
                  },
                ]
        )
        setEducationHistories(
          detail.educationHistories.length > 0
            ? detail.educationHistories.map((item: any) => ({
                level: String(item.level || ""),
                institution: String(item.institution || ""),
                major: String(item.major || ""),
                start_year: item.start_year != null ? String(item.start_year) : "",
                end_year: item.end_year != null ? String(item.end_year) : "",
                gpa: item.gpa != null ? String(item.gpa) : "",
                notes: String(item.notes || ""),
              }))
            : storedEducation.length > 0
              ? storedEducation
              : [
                  {
                    level: String(legacyEducation.last_level || ""),
                    institution: String(legacyEducation.institution || ""),
                    major: String(legacyEducation.major || ""),
                    start_year: "",
                    end_year:
                      legacyEducation.graduation_year != null
                        ? String(legacyEducation.graduation_year)
                        : "",
                    gpa: "",
                    notes: String(legacyEducation.notes || ""),
                  },
                ]
        )
        setInformalEducations(
          detail.informalEducations.length > 0
            ? detail.informalEducations.map((item: any) => ({
                name: String(item.name || ""),
                provider: String(item.provider || ""),
                year: item.year != null ? String(item.year) : "",
                certificate: String(item.certificate || ""),
                notes: String(item.notes || ""),
              }))
            : storedInformalEducation.length > 0
              ? storedInformalEducation
              : [{ ...EMPTY_INFORMAL_EDUCATION }]
        )
        setOrganizationExperiences(
          detail.organizationExperiences.length > 0
            ? detail.organizationExperiences.map((item: any) => ({
                organization: String(item.organization || ""),
                role: String(item.role || ""),
                start_year: item.start_year != null ? String(item.start_year) : "",
                end_year: item.end_year != null ? String(item.end_year) : "",
                notes: String(item.notes || ""),
              }))
            : storedOrganizationExperience.length > 0
              ? storedOrganizationExperience
              : [{ ...EMPTY_ORGANIZATION_EXPERIENCE }]
        )
        setWorkHistories(
          detail.workHistories.length > 0
            ? detail.workHistories.map((item: any) => ({
                company: String(item.company || ""),
                position: String(item.position || ""),
                start_date: String(item.start_date || ""),
                end_date: String(item.end_date || ""),
                reason_for_leaving: String(item.reason_for_leaving || ""),
                notes: String(item.notes || ""),
              }))
            : storedWorkHistory.length > 0
              ? storedWorkHistory
              : [{ ...EMPTY_WORK_HISTORY }]
        )
        setPortfolioItems(
          detail.portfolioItems.length > 0
            ? detail.portfolioItems.map((item: any) => ({
                title: String(item.title || ""),
                role: String(item.role || ""),
                year: item.year != null ? String(item.year) : "",
                url: String(item.url || ""),
                description: String(item.description || ""),
              }))
            : storedPortfolio.length > 0
              ? storedPortfolio
              : [{ ...EMPTY_PORTFOLIO_ITEM }]
        )
      } catch {
        if (cancelled) return
        setInformalEducations(
          storedInformalEducation.length > 0
            ? storedInformalEducation
            : [{ ...EMPTY_INFORMAL_EDUCATION }]
        )
        setOrganizationExperiences(
          storedOrganizationExperience.length > 0
            ? storedOrganizationExperience
            : [{ ...EMPTY_ORGANIZATION_EXPERIENCE }]
        )
        setWorkHistories(
          storedWorkHistory.length > 0
            ? storedWorkHistory
            : [{ ...EMPTY_WORK_HISTORY }]
        )
        setPortfolioItems(
          storedPortfolio.length > 0
            ? storedPortfolio
            : [{ ...EMPTY_PORTFOLIO_ITEM }]
        )
      }
      }
      loadDetails()
      return () => {
        cancelled = true
      }
    }
  }, [employees, id, getProfileDetails])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const allowNoDepartment =
      selectedGradeLevel != null && selectedGradeLevel >= DEPARTMENT_OPTIONAL_MIN_LEVEL

    const deptId = formData.department_id?.trim() ? formData.department_id : null
    if (!deptId && !allowNoDepartment) {
      setError(
        `Departemen wajib diisi untuk job level di bawah ${DEPARTMENT_OPTIONAL_MIN_LEVEL}.`
      )
      return
    }

    setSaving(true)
    try {
      const updated = await update(id, {
        full_name: formData.full_name,
        employee_number: formData.employee_number || null,
        email: formData.email || null,
        phone: formData.phone || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        religion: formData.religion || null,
        marital_status: formData.marital_status || null,
        address: formData.address || null,
        city: formData.city || null,
        department_id: deptId,
        reports_to_profile_id:
          formData.reports_to_profile_id && formData.reports_to_profile_id !== id
            ? formData.reports_to_profile_id
            : null,
        division_id: formData.division_id || null,
        position_id: formData.position_id || null,
        job_grade_id: formData.job_grade_id || null,
        employment_type: formData.employment_type,
        app_role: formData.app_role,
        status: formData.status,
        join_date: formData.join_date,
        end_date: formData.end_date || null,
        probation_end_date: formData.probation_end_date || null,
        npwp: formData.npwp || null,
        ptkp_status: formData.ptkp_status,
        tax_position: formData.tax_position,
        bpjs_tk_number: formData.bpjs_tk_number || null,
        bpjs_kes_number: formData.bpjs_kes_number || null,
        bank_name: formData.bank_name || null,
        bank_account_number: formData.bank_account_number || null,
        bank_account_name: formData.bank_account_name || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        documents: {
          ...rawDocuments,
          tax: {
            ptkp_status: formData.ptkp_status,
            position: formData.tax_position,
          },
        },
      })
      try {
        await fetch("/api/auth/sync-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: id,
            userId: (updated as any)?.user_id ?? null,
            email: (updated as any)?.email ?? formData.email ?? null,
            fullName: (updated as any)?.full_name ?? formData.full_name ?? null,
            role: formData.app_role,
            password: "wit12345",
          }),
        })
      } catch {
        // Keep profile update successful even if metadata sync is unavailable.
      }
      await replaceProfileDetails(id, {
        familyMembers: familyMembers
          .filter((item) => item.name || item.relation || item.phone)
          .map((item) => ({
            ...item,
            birth_date: item.birth_date || null,
            notes: item.notes || null,
          })),
        educationHistories: educationHistories
          .filter((item) => item.level || item.institution || item.major)
          .map((item) => ({
            ...item,
            start_year: item.start_year ? Number(item.start_year) : null,
            end_year: item.end_year ? Number(item.end_year) : null,
            gpa: item.gpa ? Number(item.gpa) : null,
            notes: item.notes || null,
          })),
        informalEducations: informalEducations
          .filter((item) => item.name || item.provider)
          .map((item) => ({
            ...item,
            year: item.year ? Number(item.year) : null,
            notes: item.notes || null,
          })),
        organizationExperiences: organizationExperiences
          .filter((item) => item.organization || item.role)
          .map((item) => ({
            ...item,
            start_year: item.start_year ? Number(item.start_year) : null,
            end_year: item.end_year ? Number(item.end_year) : null,
            notes: item.notes || null,
          })),
        workHistories: workHistories
          .filter((item) => item.company || item.position)
          .map((item) => ({
            ...item,
            start_date: item.start_date || null,
            end_date: item.end_date || null,
            reason_for_leaving: item.reason_for_leaving || null,
            notes: item.notes || null,
          })),
        portfolioItems: portfolioItems
          .filter((item) => item.title || item.url)
          .map((item) => ({
            ...item,
            year: item.year ? Number(item.year) : null,
            description: item.description || null,
          })),
      })
      await fetchEmployees()
      router.push(`/hr/employees/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update employee")
    } finally {
      setSaving(false)
    }
  }

  const employee = employees.find(e => e.id === id)
  if (hookLoading && !employee) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/hr/employees/${id}`}><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-foreground">Edit Karyawan</h1><p className="text-xs text-muted-foreground">EDIT-EMPLOYEE : {formData.full_name || "-"}</p></div>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 px-4 pt-4 pb-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <User className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Human Resources</p>
              <h2 className="text-sm font-semibold text-foreground leading-tight">Informasi Karyawan</h2>
            </div>
          </div>
          <CardContent className="space-y-0 px-0 pb-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList variant="line" className="px-4 flex-wrap">
                <TabsTrigger value="personal">
                  <UserCircle className="size-3.5" />
                  Data Pribadi
                </TabsTrigger>
                <TabsTrigger value="employment">
                  <Briefcase className="size-3.5" />
                  Kepegawaian
                </TabsTrigger>
                <TabsTrigger value="family">
                  <Users className="size-3.5" />
                  Data Keluarga
                </TabsTrigger>
                <TabsTrigger value="education">
                  <GraduationCap className="size-3.5" />
                  Pendidikan
                </TabsTrigger>
                <TabsTrigger value="career">
                  <TrendingUp className="size-3.5" />
                  Karier
                </TabsTrigger>
                <TabsTrigger value="portfolio">
                  <FolderOpen className="size-3.5" />
                  Portfolio
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="kompensasi">
                    <DollarSign className="size-3.5" />
                    Kompensasi
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="personal" className="px-4 pt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label>Nama Lengkap <span className="text-red-400">*</span></Label><Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required className="bg-background border-border text-foreground" /></div>
                  <div className="space-y-2"><Label>Nomor Karyawan</Label><Input value={formData.employee_number} onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })} className="bg-background border-border text-foreground" /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-background border-border text-foreground" /></div>
                  <div className="space-y-2"><Label>Telepon</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-background border-border text-foreground" /></div>
                  <div className="space-y-2"><Label>Tanggal Lahir</Label><Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} className="bg-background border-border text-foreground" /></div>
                  <div className="space-y-2">
                    <Label>Jenis Kelamin</Label>
                    <Select value={formData.gender || "__none__"} onValueChange={(value) => setFormData({ ...formData, gender: value === "__none__" ? "" : value })}>
                      <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="__none__">-</SelectItem><SelectItem value="male">Laki-laki</SelectItem><SelectItem value="female">Perempuan</SelectItem><SelectItem value="other">Lainnya</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Agama</Label><Input value={formData.religion} onChange={(e) => setFormData({ ...formData, religion: e.target.value })} className="bg-background border-border text-foreground" /></div>
                  <div className="space-y-2">
                    <Label>Status Pernikahan</Label>
                    <Select value={formData.marital_status || "__none__"} onValueChange={(value) => setFormData({ ...formData, marital_status: value === "__none__" ? "" : value })}>
                      <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="__none__">-</SelectItem><SelectItem value="single">Belum menikah</SelectItem><SelectItem value="married">Menikah</SelectItem><SelectItem value="divorced">Cerai</SelectItem><SelectItem value="widowed">Duda/Janda</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Kota</Label><Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="bg-background border-border text-foreground" /></div>
                  <div className="space-y-2 md:col-span-2"><Label>Alamat</Label><Textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="bg-background border-border text-foreground" rows={3} /></div>
                </div>
              </TabsContent>

              <TabsContent value="employment" className="px-4 pt-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Departemen</Label>
                    <Select value={formData.department_id || "__none__"} onValueChange={(value) => setFormData({ ...formData, department_id: value === "__none__" ? "" : value })}>
                      <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="__none__">-</SelectItem>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.code} — {d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Divisi</Label>
                    <Select value={formData.division_id || "__none__"} onValueChange={(value) => setFormData({ ...formData, division_id: value === "__none__" ? "" : value })}>
                      <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="__none__">-</SelectItem>{divisions.map((d) => <SelectItem key={d.id} value={d.id}>{d.code} — {d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Atasan (Reports To)</Label>
                    <Select
                      value={formData.reports_to_profile_id || "__none__"}
                      disabled={selectedGradeLevel == null}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          reports_to_profile_id: value === "__none__" ? "" : value,
                        })
                      }
                    >
                      <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Pilih atasan" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-</SelectItem>
                        {eligibleManagers
                          .map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.full_name}
                              {emp.employee_number ? ` (${emp.employee_number})` : ""}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {selectedGradeLevel == null ? (
                      <p className="text-xs text-muted-foreground">Pilih jabatan/grade dulu agar daftar atasan akurat.</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label>Jabatan</Label>
                    <Select
                      value={formData.position_id || "__none__"}
                      onValueChange={(value) => {
                        const nextPositionId = value === "__none__" ? "" : value
                        const selectedPosition = positions.find(
                          (p) => String(p.id) === nextPositionId
                        )
                        setFormData({
                          ...formData,
                          position_id: nextPositionId,
                          job_grade_id:
                            (selectedPosition as any)?.job_grade_id
                              ? String((selectedPosition as any).job_grade_id)
                              : formData.job_grade_id,
                        })
                      }}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="__none__">-</SelectItem>{positions.map((p) => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}{(p as any).hr_job_grades?.level ? ` (Level ${(p as any).hr_job_grades.level})` : ""}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Job Grade</Label>
                    <Select value={formData.job_grade_id || "__none__"} onValueChange={(value) => setFormData({ ...formData, job_grade_id: value === "__none__" ? "" : value })}>
                      <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="__none__">-</SelectItem>{jobGrades.map((g) => <SelectItem key={g.id} value={g.id}>{g.code} — {g.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipe Karyawan</Label>
                    <Select value={formData.employment_type} onValueChange={(value) => setFormData({ ...formData, employment_type: value })}>
                      <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="permanent">Tetap</SelectItem><SelectItem value="contract">Kontrak</SelectItem><SelectItem value="freelance">Freelance</SelectItem><SelectItem value="intern">Magang</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Role Aplikasi</Label>
                    <Select value={formData.app_role} onValueChange={(value) => setFormData({ ...formData, app_role: value })}>
                      <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="hr_admin">HR Admin</SelectItem>
                        <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="active">Aktif</SelectItem><SelectItem value="inactive">Non-Aktif</SelectItem><SelectItem value="resigned">Resign</SelectItem><SelectItem value="terminated">Terminated</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Tanggal Bergabung <span className="text-red-400">*</span></Label><Input type="date" required value={formData.join_date} onChange={(e) => setFormData({ ...formData, join_date: e.target.value })} className="bg-background border-border text-foreground" /></div>
                  <div className="space-y-2"><Label>Akhir Probation</Label><Input type="date" value={formData.probation_end_date} onChange={(e) => setFormData({ ...formData, probation_end_date: e.target.value })} className="bg-background border-border text-foreground" /></div>
                  <div className="space-y-2"><Label>Tanggal Berakhir Kontrak</Label><Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="bg-background border-border text-foreground" /></div>
                  <div className="space-y-2"><Label>NPWP</Label><Input value={formData.npwp} onChange={(e) => setFormData({ ...formData, npwp: e.target.value })} className="bg-background border-border text-foreground" /></div>
                  <div className="space-y-2">
                    <Label>Status PTKP (Perpajakan)</Label>
                    <Select value={formData.ptkp_status} onValueChange={(value) => setFormData({ ...formData, ptkp_status: value })}>
                      <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["TK/0", "TK/1", "TK/2", "TK/3", "K/0", "K/1", "K/2", "K/3", "K/I/0", "K/I/1", "K/I/2", "K/I/3"].map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Posisi Pajak</Label>
                    <Select value={formData.tax_position} onValueChange={(value) => setFormData({ ...formData, tax_position: value })}>
                      <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="non-staff">Non-staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>BPJS TK Number</Label><Input value={formData.bpjs_tk_number} onChange={(e) => setFormData({ ...formData, bpjs_tk_number: e.target.value })} className="bg-background border-border text-foreground" /></div>
                  <div className="space-y-2"><Label>BPJS Kesehatan Number</Label><Input value={formData.bpjs_kes_number} onChange={(e) => setFormData({ ...formData, bpjs_kes_number: e.target.value })} className="bg-background border-border text-foreground" /></div>
                  <div className="space-y-2"><Label>Nama Kontak Darurat</Label><Input value={formData.emergency_contact_name} onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })} className="bg-background border-border text-foreground" /></div>
                  <div className="space-y-2"><Label>No. Kontak Darurat</Label><Input value={formData.emergency_contact_phone} onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })} className="bg-background border-border text-foreground" /></div>
                  <div className="space-y-2"><Label>Bank</Label><Input value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} className="bg-background border-border text-foreground" /></div>
                  <div className="space-y-2"><Label>Nomor Rekening</Label><Input value={formData.bank_account_number} onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })} className="bg-background border-border text-foreground" /></div>
                  <div className="space-y-2"><Label>Nama Pemilik Rekening</Label><Input value={formData.bank_account_name} onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })} className="bg-background border-border text-foreground" /></div>
                </div>
              </TabsContent>

              <TabsContent value="family" className="px-4 pt-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Riwayat keluarga bisa lebih dari satu data.</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-border text-foreground"
                      onClick={() =>
                        setFamilyMembers((prev) => [...prev, { ...EMPTY_FAMILY_MEMBER }])
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Keluarga
                    </Button>
                  </div>

                  {familyMembers.map((member, idx) => (
                    <div key={`family-${idx}`} className="rounded-lg border border-border p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Anggota Keluarga #{idx + 1}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                          onClick={() =>
                            setFamilyMembers((prev) =>
                              prev.length === 1
                                ? [{ ...EMPTY_FAMILY_MEMBER }]
                                : prev.filter((_, i) => i !== idx)
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Nama</Label><Input value={member.name} onChange={(e) => setFamilyMembers((prev) => prev.map((item, i) => i === idx ? { ...item, name: e.target.value } : item))} className="bg-background border-border text-foreground" /></div>
                        <div className="space-y-2"><Label>Relasi</Label><Input value={member.relation} onChange={(e) => setFamilyMembers((prev) => prev.map((item, i) => i === idx ? { ...item, relation: e.target.value } : item))} className="bg-background border-border text-foreground" placeholder="Pasangan / Anak / Ayah / Ibu" /></div>
                        <div className="space-y-2"><Label>No. HP</Label><Input value={member.phone} onChange={(e) => setFamilyMembers((prev) => prev.map((item, i) => i === idx ? { ...item, phone: e.target.value } : item))} className="bg-background border-border text-foreground" /></div>
                        <div className="space-y-2"><Label>Tanggal Lahir</Label><Input type="date" value={member.birth_date} onChange={(e) => setFamilyMembers((prev) => prev.map((item, i) => i === idx ? { ...item, birth_date: e.target.value } : item))} className="bg-background border-border text-foreground" /></div>
                        <div className="space-y-2">
                          <Label>Tanggungan Pajak</Label>
                          <Select value={member.dependent_for_tax ? "yes" : "no"} onValueChange={(value) => setFamilyMembers((prev) => prev.map((item, i) => i === idx ? { ...item, dependent_for_tax: value === "yes" } : item))}>
                            <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="yes">Ya</SelectItem><SelectItem value="no">Tidak</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2"><Label>Catatan</Label><Textarea rows={2} value={member.notes} onChange={(e) => setFamilyMembers((prev) => prev.map((item, i) => i === idx ? { ...item, notes: e.target.value } : item))} className="bg-background border-border text-foreground" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="education" className="px-4 pt-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Riwayat pendidikan dapat menampung banyak data.</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-border text-foreground"
                      onClick={() =>
                        setEducationHistories((prev) => [...prev, { ...EMPTY_EDUCATION_HISTORY }])
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Riwayat
                    </Button>
                  </div>

                  {educationHistories.map((edu, idx) => (
                    <div key={`education-${idx}`} className="rounded-lg border border-border p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Pendidikan #{idx + 1}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                          onClick={() =>
                            setEducationHistories((prev) =>
                              prev.length === 1
                                ? [{ ...EMPTY_EDUCATION_HISTORY }]
                                : prev.filter((_, i) => i !== idx)
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Jenjang</Label><Input value={edu.level} onChange={(e) => setEducationHistories((prev) => prev.map((item, i) => i === idx ? { ...item, level: e.target.value } : item))} placeholder="SMA / D3 / S1 / S2" className="bg-background border-border text-foreground" /></div>
                        <div className="space-y-2"><Label>Institusi</Label><Input value={edu.institution} onChange={(e) => setEducationHistories((prev) => prev.map((item, i) => i === idx ? { ...item, institution: e.target.value } : item))} className="bg-background border-border text-foreground" /></div>
                        <div className="space-y-2"><Label>Jurusan</Label><Input value={edu.major} onChange={(e) => setEducationHistories((prev) => prev.map((item, i) => i === idx ? { ...item, major: e.target.value } : item))} className="bg-background border-border text-foreground" /></div>
                        <div className="space-y-2"><Label>IPK/Nilai</Label><Input value={edu.gpa} onChange={(e) => setEducationHistories((prev) => prev.map((item, i) => i === idx ? { ...item, gpa: e.target.value } : item))} className="bg-background border-border text-foreground" placeholder="3.75" /></div>
                        <div className="space-y-2"><Label>Tahun Mulai</Label><Input type="number" min={1950} max={2100} value={edu.start_year} onChange={(e) => setEducationHistories((prev) => prev.map((item, i) => i === idx ? { ...item, start_year: e.target.value } : item))} className="bg-background border-border text-foreground" /></div>
                        <div className="space-y-2"><Label>Tahun Lulus</Label><Input type="number" min={1950} max={2100} value={edu.end_year} onChange={(e) => setEducationHistories((prev) => prev.map((item, i) => i === idx ? { ...item, end_year: e.target.value } : item))} className="bg-background border-border text-foreground" /></div>
                        <div className="space-y-2 md:col-span-2"><Label>Catatan</Label><Textarea rows={2} value={edu.notes} onChange={(e) => setEducationHistories((prev) => prev.map((item, i) => i === idx ? { ...item, notes: e.target.value } : item))} className="bg-background border-border text-foreground" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="career" className="px-4 pt-5">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Pendidikan informal (kursus/sertifikasi) dapat diisi banyak data.</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-border text-foreground"
                        onClick={() =>
                          setInformalEducations((prev) => [...prev, { ...EMPTY_INFORMAL_EDUCATION }])
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Pendidikan Informal
                      </Button>
                    </div>
                    {informalEducations.map((item, idx) => (
                      <div key={`informal-${idx}`} className="rounded-lg border border-border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">Pendidikan Informal #{idx + 1}</p>
                          <Button type="button" size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setInformalEducations((prev) => prev.length === 1 ? [{ ...EMPTY_INFORMAL_EDUCATION }] : prev.filter((_, i) => i !== idx))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Nama Program</Label><Input value={item.name} onChange={(e) => setInformalEducations((prev) => prev.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} className="bg-background border-border text-foreground" /></div>
                          <div className="space-y-2"><Label>Penyelenggara</Label><Input value={item.provider} onChange={(e) => setInformalEducations((prev) => prev.map((x, i) => i === idx ? { ...x, provider: e.target.value } : x))} className="bg-background border-border text-foreground" /></div>
                          <div className="space-y-2"><Label>Tahun</Label><Input type="number" min={1950} max={2100} value={item.year} onChange={(e) => setInformalEducations((prev) => prev.map((x, i) => i === idx ? { ...x, year: e.target.value } : x))} className="bg-background border-border text-foreground" /></div>
                          <div className="space-y-2"><Label>Sertifikat</Label><Input value={item.certificate} onChange={(e) => setInformalEducations((prev) => prev.map((x, i) => i === idx ? { ...x, certificate: e.target.value } : x))} className="bg-background border-border text-foreground" placeholder="Nomor/jenis sertifikat" /></div>
                          <div className="space-y-2 md:col-span-2"><Label>Catatan</Label><Textarea rows={2} value={item.notes} onChange={(e) => setInformalEducations((prev) => prev.map((x, i) => i === idx ? { ...x, notes: e.target.value } : x))} className="bg-background border-border text-foreground" /></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Pengalaman organisasi bisa lebih dari satu.</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-border text-foreground"
                        onClick={() =>
                          setOrganizationExperiences((prev) => [
                            ...prev,
                            { ...EMPTY_ORGANIZATION_EXPERIENCE },
                          ])
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Organisasi
                      </Button>
                    </div>
                    {organizationExperiences.map((item, idx) => (
                      <div key={`org-${idx}`} className="rounded-lg border border-border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">Organisasi #{idx + 1}</p>
                          <Button type="button" size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setOrganizationExperiences((prev) => prev.length === 1 ? [{ ...EMPTY_ORGANIZATION_EXPERIENCE }] : prev.filter((_, i) => i !== idx))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Nama Organisasi</Label><Input value={item.organization} onChange={(e) => setOrganizationExperiences((prev) => prev.map((x, i) => i === idx ? { ...x, organization: e.target.value } : x))} className="bg-background border-border text-foreground" /></div>
                          <div className="space-y-2"><Label>Peran/Jabatan</Label><Input value={item.role} onChange={(e) => setOrganizationExperiences((prev) => prev.map((x, i) => i === idx ? { ...x, role: e.target.value } : x))} className="bg-background border-border text-foreground" /></div>
                          <div className="space-y-2"><Label>Tahun Mulai</Label><Input type="number" min={1950} max={2100} value={item.start_year} onChange={(e) => setOrganizationExperiences((prev) => prev.map((x, i) => i === idx ? { ...x, start_year: e.target.value } : x))} className="bg-background border-border text-foreground" /></div>
                          <div className="space-y-2"><Label>Tahun Selesai</Label><Input type="number" min={1950} max={2100} value={item.end_year} onChange={(e) => setOrganizationExperiences((prev) => prev.map((x, i) => i === idx ? { ...x, end_year: e.target.value } : x))} className="bg-background border-border text-foreground" /></div>
                          <div className="space-y-2 md:col-span-2"><Label>Catatan</Label><Textarea rows={2} value={item.notes} onChange={(e) => setOrganizationExperiences((prev) => prev.map((x, i) => i === idx ? { ...x, notes: e.target.value } : x))} className="bg-background border-border text-foreground" /></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Riwayat pekerjaan sebelumnya.</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-border text-foreground"
                        onClick={() =>
                          setWorkHistories((prev) => [...prev, { ...EMPTY_WORK_HISTORY }])
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Riwayat Kerja
                      </Button>
                    </div>
                    {workHistories.map((item, idx) => (
                      <div key={`work-${idx}`} className="rounded-lg border border-border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">Pekerjaan #{idx + 1}</p>
                          <Button type="button" size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setWorkHistories((prev) => prev.length === 1 ? [{ ...EMPTY_WORK_HISTORY }] : prev.filter((_, i) => i !== idx))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Perusahaan</Label><Input value={item.company} onChange={(e) => setWorkHistories((prev) => prev.map((x, i) => i === idx ? { ...x, company: e.target.value } : x))} className="bg-background border-border text-foreground" /></div>
                          <div className="space-y-2"><Label>Posisi</Label><Input value={item.position} onChange={(e) => setWorkHistories((prev) => prev.map((x, i) => i === idx ? { ...x, position: e.target.value } : x))} className="bg-background border-border text-foreground" /></div>
                          <div className="space-y-2"><Label>Mulai</Label><Input type="date" value={item.start_date} onChange={(e) => setWorkHistories((prev) => prev.map((x, i) => i === idx ? { ...x, start_date: e.target.value } : x))} className="bg-background border-border text-foreground" /></div>
                          <div className="space-y-2"><Label>Selesai</Label><Input type="date" value={item.end_date} onChange={(e) => setWorkHistories((prev) => prev.map((x, i) => i === idx ? { ...x, end_date: e.target.value } : x))} className="bg-background border-border text-foreground" /></div>
                          <div className="space-y-2 md:col-span-2"><Label>Alasan Berhenti</Label><Input value={item.reason_for_leaving} onChange={(e) => setWorkHistories((prev) => prev.map((x, i) => i === idx ? { ...x, reason_for_leaving: e.target.value } : x))} className="bg-background border-border text-foreground" /></div>
                          <div className="space-y-2 md:col-span-2"><Label>Catatan</Label><Textarea rows={2} value={item.notes} onChange={(e) => setWorkHistories((prev) => prev.map((x, i) => i === idx ? { ...x, notes: e.target.value } : x))} className="bg-background border-border text-foreground" /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="portfolio" className="px-4 pt-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Portfolio/proyek yang pernah dikerjakan.</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-border text-foreground"
                      onClick={() =>
                        setPortfolioItems((prev) => [...prev, { ...EMPTY_PORTFOLIO_ITEM }])
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Portfolio
                    </Button>
                  </div>
                  {portfolioItems.map((item, idx) => (
                    <div key={`portfolio-${idx}`} className="rounded-lg border border-border p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Portfolio #{idx + 1}</p>
                        <Button type="button" size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setPortfolioItems((prev) => prev.length === 1 ? [{ ...EMPTY_PORTFOLIO_ITEM }] : prev.filter((_, i) => i !== idx))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Judul</Label><Input value={item.title} onChange={(e) => setPortfolioItems((prev) => prev.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))} className="bg-background border-border text-foreground" /></div>
                        <div className="space-y-2"><Label>Peran</Label><Input value={item.role} onChange={(e) => setPortfolioItems((prev) => prev.map((x, i) => i === idx ? { ...x, role: e.target.value } : x))} className="bg-background border-border text-foreground" /></div>
                        <div className="space-y-2"><Label>Tahun</Label><Input type="number" min={1950} max={2100} value={item.year} onChange={(e) => setPortfolioItems((prev) => prev.map((x, i) => i === idx ? { ...x, year: e.target.value } : x))} className="bg-background border-border text-foreground" /></div>
                        <div className="space-y-2"><Label>Link URL</Label><Input value={item.url} onChange={(e) => setPortfolioItems((prev) => prev.map((x, i) => i === idx ? { ...x, url: e.target.value } : x))} className="bg-background border-border text-foreground" placeholder="https://..." /></div>
                        <div className="space-y-2 md:col-span-2"><Label>Deskripsi</Label><Textarea rows={3} value={item.description} onChange={(e) => setPortfolioItems((prev) => prev.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} className="bg-background border-border text-foreground" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {isAdmin && (
                <TabsContent value="kompensasi" className="px-4 pt-5 space-y-6">
                  {/* Gaji Pokok */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />Gaji Pokok
                        </CardTitle>
                        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setSalaryForm({ amount: String(currentSalary?.amount || ""), effective_date: new Date().toISOString().slice(0, 10), reason: "", reason_other: "", notes: "" }); setSalaryDialogOpen(true) }}>
                          <Pencil className="w-3 h-3 mr-1" />{currentSalary ? "Ubah Gaji" : "Set Gaji Manual"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {compLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2"><Loader2 className="w-4 h-4 animate-spin" />Memuat...</div>
                      ) : currentSalary ? (
                        <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                          <div>
                            <p className="text-2xl font-bold text-foreground">{formatCurrency(currentSalary.amount)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Berlaku: {currentSalary.effective_date}
                              {currentSalary.reason && ` · ${reasonLabel(currentSalary.reason)}`}
                              {currentSalary.reason === "other" && currentSalary.reason_other && `: ${currentSalary.reason_other}`}
                            </p>
                          </div>
                          <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Override Manual</Badge>
                        </div>
                      ) : (
                        <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                          Gaji diambil dari <strong>salary matrix</strong> berdasarkan grade karyawan. Set gaji manual untuk override.
                        </div>
                      )}
                      {salaryHistory.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Riwayat Perubahan Gaji</p>
                          <table className="w-full text-sm">
                            <thead><tr className="border-b border-border">
                              <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Tgl Efektif</th>
                              <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Jumlah</th>
                              <th className="text-left py-2 font-medium text-muted-foreground">Alasan</th>
                            </tr></thead>
                            <tbody>
                              {salaryHistory.map((s, i) => (
                                <tr key={s.id} className="border-b border-border/50">
                                  <td className="py-2 pr-4 text-muted-foreground">{s.effective_date}</td>
                                  <td className="py-2 pr-4 text-right font-medium">{formatCurrency(s.amount)}</td>
                                  <td className="py-2 text-muted-foreground text-xs">
                                    {reasonLabel(s.reason)}{s.reason === "other" && s.reason_other ? `: ${s.reason_other}` : ""}
                                    {i === 0 && <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 text-xs">Aktif</Badge>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tunjangan */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Tunjangan</CardTitle>
                        <Button type="button" size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={openAddAllowance}>
                          <Plus className="w-3 h-3 mr-1" />Tambah
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {compAllowances.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Belum ada tunjangan.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead><tr className="border-b border-border">
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Komponen</th>
                            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Sifat</th>
                            <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Jumlah</th>
                            <th className="text-right py-2 font-medium text-muted-foreground">Aksi</th>
                          </tr></thead>
                          <tbody>
                            {compAllowances.map((a) => (
                              <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30">
                                <td className="py-2 pr-4 font-medium text-foreground">
                                  {(a as any).salary_components?.name || "-"}
                                  <span className="ml-2 text-xs text-muted-foreground">{(a as any).salary_components?.type === "earning" ? "Tunjangan" : "Potongan"}</span>
                                </td>
                                <td className="py-2 pr-4">
                                  <Badge className={(a as any).salary_components?.is_fixed === false ? "bg-yellow-500/20 text-yellow-400 text-xs" : "bg-muted text-muted-foreground text-xs"}>
                                    {(a as any).salary_components?.is_fixed === false ? "Tidak Tetap" : "Tetap"}
                                  </Badge>
                                </td>
                                <td className="py-2 pr-4 text-right">{formatCurrency(a.amount)}</td>
                                <td className="py-2 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEditAllowance(a)}><Pencil className="w-3 h-3" /></Button>
                                    <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-400" onClick={() => openHistory(a.id, (a as any).salary_components?.name || "Tunjangan")}><History className="w-3 h-3" /></Button>
                                    <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400" onClick={() => handleDeleteAllowance(a)}><Trash2 className="w-3 h-3" /></Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </CardContent>
                  </Card>

                  {/* Dialog: Ubah Gaji */}
                  <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
                    <DialogContent className="max-w-md">
                      <DialogHeader><DialogTitle>{currentSalary ? "Ubah Gaji Pokok" : "Set Gaji Manual"}</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2"><Label>Jumlah (Rp) <span className="text-red-400">*</span></Label><Input type="number" min={0} value={salaryForm.amount} onChange={(e) => setSalaryForm({ ...salaryForm, amount: e.target.value })} placeholder="8500000" /></div>
                        <div className="space-y-2"><Label>Tanggal Efektif <span className="text-red-400">*</span></Label><Input type="date" value={salaryForm.effective_date} onChange={(e) => setSalaryForm({ ...salaryForm, effective_date: e.target.value })} /></div>
                        <div className="space-y-2">
                          <Label>Alasan</Label>
                          <Select value={salaryForm.reason} onValueChange={(v) => setSalaryForm({ ...salaryForm, reason: v, reason_other: "" })}>
                            <SelectTrigger><SelectValue placeholder="Pilih alasan..." /></SelectTrigger>
                            <SelectContent>{SALARY_REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        {salaryForm.reason === "other" && <div className="space-y-2"><Label>Keterangan Lainnya</Label><Input value={salaryForm.reason_other} onChange={(e) => setSalaryForm({ ...salaryForm, reason_other: e.target.value })} /></div>}
                        <div className="space-y-2"><Label>Catatan</Label><Textarea value={salaryForm.notes} onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })} rows={2} /></div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setSalaryDialogOpen(false)} disabled={salarySubmitting}>Batal</Button>
                        <Button type="button" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSalarySave} disabled={salarySubmitting || !salaryForm.amount || !salaryForm.effective_date}>
                          {salarySubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Simpan
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Dialog: Tunjangan */}
                  <Dialog open={allowanceDialogOpen} onOpenChange={setAllowanceDialogOpen}>
                    <DialogContent className="max-w-md">
                      <DialogHeader><DialogTitle>{editingAllowanceId ? "Edit Tunjangan" : "Tambah Tunjangan"}</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Komponen <span className="text-red-400">*</span></Label>
                          <Select value={allowanceForm.salary_component_id} onValueChange={(v) => setAllowanceForm({ ...allowanceForm, salary_component_id: v })} disabled={!!editingAllowanceId}>
                            <SelectTrigger><SelectValue placeholder="Pilih komponen..." /></SelectTrigger>
                            <SelectContent>{salaryComponents.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.type === "earning" ? "Tunjangan" : "Potongan"})</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2"><Label>Jumlah (Rp) <span className="text-red-400">*</span></Label><Input type="number" min={0} value={allowanceForm.amount} onChange={(e) => setAllowanceForm({ ...allowanceForm, amount: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Tanggal Efektif</Label><Input type="date" value={allowanceForm.effective_date} onChange={(e) => setAllowanceForm({ ...allowanceForm, effective_date: e.target.value })} /></div>
                        <div className="space-y-2">
                          <Label>Alasan Perubahan</Label>
                          <Select value={allowanceForm.reason} onValueChange={(v) => setAllowanceForm({ ...allowanceForm, reason: v, reason_other: "" })}>
                            <SelectTrigger><SelectValue placeholder="Pilih alasan..." /></SelectTrigger>
                            <SelectContent>{SALARY_REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        {allowanceForm.reason === "other" && <div className="space-y-2"><Label>Keterangan Lainnya</Label><Input value={allowanceForm.reason_other} onChange={(e) => setAllowanceForm({ ...allowanceForm, reason_other: e.target.value })} /></div>}
                        <div className="space-y-2"><Label>Catatan</Label><Textarea value={allowanceForm.notes} onChange={(e) => setAllowanceForm({ ...allowanceForm, notes: e.target.value })} rows={2} /></div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setAllowanceDialogOpen(false)} disabled={allowanceSubmitting}>Batal</Button>
                        <Button type="button" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAllowanceSave} disabled={allowanceSubmitting || !allowanceForm.amount}>
                          {allowanceSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Simpan
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Modal: Riwayat Tunjangan */}
                  <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
                    <DialogContent className="max-w-lg">
                      <DialogHeader><DialogTitle>Riwayat — {historyTitle}</DialogTitle></DialogHeader>
                      {historyLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center"><Loader2 className="w-4 h-4 animate-spin" />Memuat...</div>
                      ) : historyItems.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-4">Belum ada riwayat perubahan.</p>
                      ) : (
                        <div className="overflow-x-auto max-h-80">
                          <table className="w-full text-sm">
                            <thead><tr className="border-b border-border">
                              <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Tanggal</th>
                              <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Tipe</th>
                              <th className="text-right py-2 pr-3 font-medium text-muted-foreground">Lama</th>
                              <th className="text-right py-2 font-medium text-muted-foreground">Baru</th>
                            </tr></thead>
                            <tbody>
                              {historyItems.map((h) => (
                                <tr key={h.id} className="border-b border-border/50">
                                  <td className="py-2 pr-3 text-muted-foreground">{new Date(h.created_at).toLocaleDateString("id-ID")}</td>
                                  <td className="py-2 pr-3">
                                    <Badge className={h.change_type === "create" ? "bg-emerald-500/20 text-emerald-400 text-xs" : h.change_type === "delete" ? "bg-red-500/20 text-red-400 text-xs" : "bg-blue-500/20 text-blue-400 text-xs"}>
                                      {h.change_type === "create" ? "Tambah" : h.change_type === "delete" ? "Hapus" : "Ubah"}
                                    </Badge>
                                  </td>
                                  <td className="py-2 pr-3 text-right text-muted-foreground">{h.old_amount != null ? formatCurrency(h.old_amount) : "—"}</td>
                                  <td className="py-2 text-right">{h.new_amount != null ? formatCurrency(h.new_amount) : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </TabsContent>
              )}
            </Tabs>
            <div className="flex items-center justify-end gap-3 px-4 py-4 mt-4 border-t border-border">
              <Link href={`/hr/employees/${id}`}><Button type="button" variant="ghost" className="text-muted-foreground">Batal</Button></Link>
              {activeTab !== "kompensasi" && (
                <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : <><Save className="w-4 h-4 mr-2" />Simpan Perubahan</>}</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
