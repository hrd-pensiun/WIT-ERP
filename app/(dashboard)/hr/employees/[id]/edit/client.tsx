"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Plus, Save, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEmployees } from "@/hooks/useEmployees"
import { useEmployeeProfileDetails } from "@/hooks/useEmployeeProfileDetails"
import { useDepartments } from "@/hooks/useDepartments"
import { useDivisions } from "@/hooks/useDivisions"
import { usePositions } from "@/hooks/usePositions"
import { useJobGrades } from "@/hooks/useJobGrades"

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

export default function EmployeeEditClient({ id }: { id: string }) {
  const router = useRouter()
  const { employees, update, loading: hookLoading, fetchEmployees } = useEmployees()
  const { departments } = useDepartments()
  const { divisions } = useDivisions()
  const { positions } = usePositions()
  const { jobGrades } = useJobGrades()
  const { getProfileDetails, replaceProfileDetails } = useEmployeeProfileDetails()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("personal")
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
        <Link href={`/hr/employees/${id}`}><Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-slate-100">Edit Karyawan</h1><p className="text-xs text-slate-500">EDIT-EMPLOYEE : {formData.full_name || "-"}</p></div>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader><CardTitle className="text-slate-100 flex items-center gap-2"><User className="w-5 h-5 text-emerald-500" /> Informasi Karyawan</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-950 border border-slate-800">
                <TabsTrigger value="personal" className="data-[state=active]:bg-emerald-600">
                  Data Pribadi
                </TabsTrigger>
                <TabsTrigger value="employment" className="data-[state=active]:bg-emerald-600">
                  Kepegawaian
                </TabsTrigger>
                <TabsTrigger value="family" className="data-[state=active]:bg-emerald-600">
                  Data Keluarga
                </TabsTrigger>
                <TabsTrigger value="education" className="data-[state=active]:bg-emerald-600">
                  Riwayat Pendidikan
                </TabsTrigger>
                <TabsTrigger value="career" className="data-[state=active]:bg-emerald-600">
                  Karier & Organisasi
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="data-[state=active]:bg-emerald-600">
                  Portfolio
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label className="text-slate-200">Nama Lengkap <span className="text-red-400">*</span></Label><Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                  <div className="space-y-2"><Label className="text-slate-200">Nomor Karyawan</Label><Input value={formData.employee_number} onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                  <div className="space-y-2"><Label className="text-slate-200">Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                  <div className="space-y-2"><Label className="text-slate-200">Telepon</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                  <div className="space-y-2"><Label className="text-slate-200">Tanggal Lahir</Label><Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Jenis Kelamin</Label>
                    <Select value={formData.gender || "__none__"} onValueChange={(value) => setFormData({ ...formData, gender: value === "__none__" ? "" : value })}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800"><SelectItem value="__none__">-</SelectItem><SelectItem value="male">Laki-laki</SelectItem><SelectItem value="female">Perempuan</SelectItem><SelectItem value="other">Lainnya</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label className="text-slate-200">Agama</Label><Input value={formData.religion} onChange={(e) => setFormData({ ...formData, religion: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Status Pernikahan</Label>
                    <Select value={formData.marital_status || "__none__"} onValueChange={(value) => setFormData({ ...formData, marital_status: value === "__none__" ? "" : value })}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800"><SelectItem value="__none__">-</SelectItem><SelectItem value="single">Belum menikah</SelectItem><SelectItem value="married">Menikah</SelectItem><SelectItem value="divorced">Cerai</SelectItem><SelectItem value="widowed">Duda/Janda</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label className="text-slate-200">Kota</Label><Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                  <div className="space-y-2 md:col-span-2"><Label className="text-slate-200">Alamat</Label><Textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" rows={3} /></div>
                </div>
              </TabsContent>

              <TabsContent value="employment" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Departemen</Label>
                    <Select value={formData.department_id || "__none__"} onValueChange={(value) => setFormData({ ...formData, department_id: value === "__none__" ? "" : value })}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800"><SelectItem value="__none__">-</SelectItem>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.code} — {d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Divisi</Label>
                    <Select value={formData.division_id || "__none__"} onValueChange={(value) => setFormData({ ...formData, division_id: value === "__none__" ? "" : value })}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800"><SelectItem value="__none__">-</SelectItem>{divisions.map((d) => <SelectItem key={d.id} value={d.id}>{d.code} — {d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Atasan (Reports To)</Label>
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
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue placeholder="Pilih atasan" /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
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
                      <p className="text-xs text-slate-500">Pilih jabatan/grade dulu agar daftar atasan akurat.</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Jabatan</Label>
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
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800"><SelectItem value="__none__">-</SelectItem>{positions.map((p) => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}{(p as any).hr_job_grades?.level ? ` (Level ${(p as any).hr_job_grades.level})` : ""}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Job Grade</Label>
                    <Select value={formData.job_grade_id || "__none__"} onValueChange={(value) => setFormData({ ...formData, job_grade_id: value === "__none__" ? "" : value })}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800"><SelectItem value="__none__">-</SelectItem>{jobGrades.map((g) => <SelectItem key={g.id} value={g.id}>{g.code} — {g.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Tipe Karyawan</Label>
                    <Select value={formData.employment_type} onValueChange={(value) => setFormData({ ...formData, employment_type: value })}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800"><SelectItem value="permanent">Tetap</SelectItem><SelectItem value="contract">Kontrak</SelectItem><SelectItem value="freelance">Freelance</SelectItem><SelectItem value="intern">Magang</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Role Aplikasi</Label>
                    <Select value={formData.app_role} onValueChange={(value) => setFormData({ ...formData, app_role: value })}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="hr_admin">HR Admin</SelectItem>
                        <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800"><SelectItem value="active">Aktif</SelectItem><SelectItem value="inactive">Non-Aktif</SelectItem><SelectItem value="resigned">Resign</SelectItem><SelectItem value="terminated">Terminated</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label className="text-slate-200">Tanggal Bergabung <span className="text-red-400">*</span></Label><Input type="date" required value={formData.join_date} onChange={(e) => setFormData({ ...formData, join_date: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                  <div className="space-y-2"><Label className="text-slate-200">Akhir Probation</Label><Input type="date" value={formData.probation_end_date} onChange={(e) => setFormData({ ...formData, probation_end_date: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                  <div className="space-y-2"><Label className="text-slate-200">Tanggal Berakhir Kontrak</Label><Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                  <div className="space-y-2"><Label className="text-slate-200">NPWP</Label><Input value={formData.npwp} onChange={(e) => setFormData({ ...formData, npwp: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Status PTKP (Perpajakan)</Label>
                    <Select value={formData.ptkp_status} onValueChange={(value) => setFormData({ ...formData, ptkp_status: value })}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        {["TK/0", "TK/1", "TK/2", "TK/3", "K/0", "K/1", "K/2", "K/3", "K/I/0", "K/I/1", "K/I/2", "K/I/3"].map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Posisi Pajak</Label>
                    <Select value={formData.tax_position} onValueChange={(value) => setFormData({ ...formData, tax_position: value })}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="non-staff">Non-staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label className="text-slate-200">BPJS TK Number</Label><Input value={formData.bpjs_tk_number} onChange={(e) => setFormData({ ...formData, bpjs_tk_number: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                  <div className="space-y-2"><Label className="text-slate-200">BPJS Kesehatan Number</Label><Input value={formData.bpjs_kes_number} onChange={(e) => setFormData({ ...formData, bpjs_kes_number: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                  <div className="space-y-2"><Label className="text-slate-200">Nama Kontak Darurat</Label><Input value={formData.emergency_contact_name} onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                  <div className="space-y-2"><Label className="text-slate-200">No. Kontak Darurat</Label><Input value={formData.emergency_contact_phone} onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                  <div className="space-y-2"><Label className="text-slate-200">Bank</Label><Input value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                  <div className="space-y-2"><Label className="text-slate-200">Nomor Rekening</Label><Input value={formData.bank_account_number} onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                  <div className="space-y-2"><Label className="text-slate-200">Nama Pemilik Rekening</Label><Input value={formData.bank_account_name} onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                </div>
              </TabsContent>

              <TabsContent value="family" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">Riwayat keluarga bisa lebih dari satu data.</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-slate-700 text-slate-200"
                      onClick={() =>
                        setFamilyMembers((prev) => [...prev, { ...EMPTY_FAMILY_MEMBER }])
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Keluarga
                    </Button>
                  </div>

                  {familyMembers.map((member, idx) => (
                    <div key={`family-${idx}`} className="rounded-lg border border-slate-800 p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-200">Anggota Keluarga #{idx + 1}</p>
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
                        <div className="space-y-2"><Label className="text-slate-200">Nama</Label><Input value={member.name} onChange={(e) => setFamilyMembers((prev) => prev.map((item, i) => i === idx ? { ...item, name: e.target.value } : item))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                        <div className="space-y-2"><Label className="text-slate-200">Relasi</Label><Input value={member.relation} onChange={(e) => setFamilyMembers((prev) => prev.map((item, i) => i === idx ? { ...item, relation: e.target.value } : item))} className="bg-slate-950 border-slate-800 text-slate-100" placeholder="Pasangan / Anak / Ayah / Ibu" /></div>
                        <div className="space-y-2"><Label className="text-slate-200">No. HP</Label><Input value={member.phone} onChange={(e) => setFamilyMembers((prev) => prev.map((item, i) => i === idx ? { ...item, phone: e.target.value } : item))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                        <div className="space-y-2"><Label className="text-slate-200">Tanggal Lahir</Label><Input type="date" value={member.birth_date} onChange={(e) => setFamilyMembers((prev) => prev.map((item, i) => i === idx ? { ...item, birth_date: e.target.value } : item))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                        <div className="space-y-2">
                          <Label className="text-slate-200">Tanggungan Pajak</Label>
                          <Select value={member.dependent_for_tax ? "yes" : "no"} onValueChange={(value) => setFamilyMembers((prev) => prev.map((item, i) => i === idx ? { ...item, dependent_for_tax: value === "yes" } : item))}>
                            <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800"><SelectItem value="yes">Ya</SelectItem><SelectItem value="no">Tidak</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2"><Label className="text-slate-200">Catatan</Label><Textarea rows={2} value={member.notes} onChange={(e) => setFamilyMembers((prev) => prev.map((item, i) => i === idx ? { ...item, notes: e.target.value } : item))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="education" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">Riwayat pendidikan dapat menampung banyak data.</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-slate-700 text-slate-200"
                      onClick={() =>
                        setEducationHistories((prev) => [...prev, { ...EMPTY_EDUCATION_HISTORY }])
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Riwayat
                    </Button>
                  </div>

                  {educationHistories.map((edu, idx) => (
                    <div key={`education-${idx}`} className="rounded-lg border border-slate-800 p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-200">Pendidikan #{idx + 1}</p>
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
                        <div className="space-y-2"><Label className="text-slate-200">Jenjang</Label><Input value={edu.level} onChange={(e) => setEducationHistories((prev) => prev.map((item, i) => i === idx ? { ...item, level: e.target.value } : item))} placeholder="SMA / D3 / S1 / S2" className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                        <div className="space-y-2"><Label className="text-slate-200">Institusi</Label><Input value={edu.institution} onChange={(e) => setEducationHistories((prev) => prev.map((item, i) => i === idx ? { ...item, institution: e.target.value } : item))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                        <div className="space-y-2"><Label className="text-slate-200">Jurusan</Label><Input value={edu.major} onChange={(e) => setEducationHistories((prev) => prev.map((item, i) => i === idx ? { ...item, major: e.target.value } : item))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                        <div className="space-y-2"><Label className="text-slate-200">IPK/Nilai</Label><Input value={edu.gpa} onChange={(e) => setEducationHistories((prev) => prev.map((item, i) => i === idx ? { ...item, gpa: e.target.value } : item))} className="bg-slate-950 border-slate-800 text-slate-100" placeholder="3.75" /></div>
                        <div className="space-y-2"><Label className="text-slate-200">Tahun Mulai</Label><Input type="number" min={1950} max={2100} value={edu.start_year} onChange={(e) => setEducationHistories((prev) => prev.map((item, i) => i === idx ? { ...item, start_year: e.target.value } : item))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                        <div className="space-y-2"><Label className="text-slate-200">Tahun Lulus</Label><Input type="number" min={1950} max={2100} value={edu.end_year} onChange={(e) => setEducationHistories((prev) => prev.map((item, i) => i === idx ? { ...item, end_year: e.target.value } : item))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                        <div className="space-y-2 md:col-span-2"><Label className="text-slate-200">Catatan</Label><Textarea rows={2} value={edu.notes} onChange={(e) => setEducationHistories((prev) => prev.map((item, i) => i === idx ? { ...item, notes: e.target.value } : item))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="career" className="mt-4">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-400">Pendidikan informal (kursus/sertifikasi) dapat diisi banyak data.</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-slate-700 text-slate-200"
                        onClick={() =>
                          setInformalEducations((prev) => [...prev, { ...EMPTY_INFORMAL_EDUCATION }])
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Pendidikan Informal
                      </Button>
                    </div>
                    {informalEducations.map((item, idx) => (
                      <div key={`informal-${idx}`} className="rounded-lg border border-slate-800 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-200">Pendidikan Informal #{idx + 1}</p>
                          <Button type="button" size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setInformalEducations((prev) => prev.length === 1 ? [{ ...EMPTY_INFORMAL_EDUCATION }] : prev.filter((_, i) => i !== idx))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label className="text-slate-200">Nama Program</Label><Input value={item.name} onChange={(e) => setInformalEducations((prev) => prev.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                          <div className="space-y-2"><Label className="text-slate-200">Penyelenggara</Label><Input value={item.provider} onChange={(e) => setInformalEducations((prev) => prev.map((x, i) => i === idx ? { ...x, provider: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                          <div className="space-y-2"><Label className="text-slate-200">Tahun</Label><Input type="number" min={1950} max={2100} value={item.year} onChange={(e) => setInformalEducations((prev) => prev.map((x, i) => i === idx ? { ...x, year: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                          <div className="space-y-2"><Label className="text-slate-200">Sertifikat</Label><Input value={item.certificate} onChange={(e) => setInformalEducations((prev) => prev.map((x, i) => i === idx ? { ...x, certificate: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" placeholder="Nomor/jenis sertifikat" /></div>
                          <div className="space-y-2 md:col-span-2"><Label className="text-slate-200">Catatan</Label><Textarea rows={2} value={item.notes} onChange={(e) => setInformalEducations((prev) => prev.map((x, i) => i === idx ? { ...x, notes: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-400">Pengalaman organisasi bisa lebih dari satu.</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-slate-700 text-slate-200"
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
                      <div key={`org-${idx}`} className="rounded-lg border border-slate-800 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-200">Organisasi #{idx + 1}</p>
                          <Button type="button" size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setOrganizationExperiences((prev) => prev.length === 1 ? [{ ...EMPTY_ORGANIZATION_EXPERIENCE }] : prev.filter((_, i) => i !== idx))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label className="text-slate-200">Nama Organisasi</Label><Input value={item.organization} onChange={(e) => setOrganizationExperiences((prev) => prev.map((x, i) => i === idx ? { ...x, organization: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                          <div className="space-y-2"><Label className="text-slate-200">Peran/Jabatan</Label><Input value={item.role} onChange={(e) => setOrganizationExperiences((prev) => prev.map((x, i) => i === idx ? { ...x, role: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                          <div className="space-y-2"><Label className="text-slate-200">Tahun Mulai</Label><Input type="number" min={1950} max={2100} value={item.start_year} onChange={(e) => setOrganizationExperiences((prev) => prev.map((x, i) => i === idx ? { ...x, start_year: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                          <div className="space-y-2"><Label className="text-slate-200">Tahun Selesai</Label><Input type="number" min={1950} max={2100} value={item.end_year} onChange={(e) => setOrganizationExperiences((prev) => prev.map((x, i) => i === idx ? { ...x, end_year: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                          <div className="space-y-2 md:col-span-2"><Label className="text-slate-200">Catatan</Label><Textarea rows={2} value={item.notes} onChange={(e) => setOrganizationExperiences((prev) => prev.map((x, i) => i === idx ? { ...x, notes: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-400">Riwayat pekerjaan sebelumnya.</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-slate-700 text-slate-200"
                        onClick={() =>
                          setWorkHistories((prev) => [...prev, { ...EMPTY_WORK_HISTORY }])
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Riwayat Kerja
                      </Button>
                    </div>
                    {workHistories.map((item, idx) => (
                      <div key={`work-${idx}`} className="rounded-lg border border-slate-800 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-200">Pekerjaan #{idx + 1}</p>
                          <Button type="button" size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setWorkHistories((prev) => prev.length === 1 ? [{ ...EMPTY_WORK_HISTORY }] : prev.filter((_, i) => i !== idx))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label className="text-slate-200">Perusahaan</Label><Input value={item.company} onChange={(e) => setWorkHistories((prev) => prev.map((x, i) => i === idx ? { ...x, company: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                          <div className="space-y-2"><Label className="text-slate-200">Posisi</Label><Input value={item.position} onChange={(e) => setWorkHistories((prev) => prev.map((x, i) => i === idx ? { ...x, position: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                          <div className="space-y-2"><Label className="text-slate-200">Mulai</Label><Input type="date" value={item.start_date} onChange={(e) => setWorkHistories((prev) => prev.map((x, i) => i === idx ? { ...x, start_date: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                          <div className="space-y-2"><Label className="text-slate-200">Selesai</Label><Input type="date" value={item.end_date} onChange={(e) => setWorkHistories((prev) => prev.map((x, i) => i === idx ? { ...x, end_date: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                          <div className="space-y-2 md:col-span-2"><Label className="text-slate-200">Alasan Berhenti</Label><Input value={item.reason_for_leaving} onChange={(e) => setWorkHistories((prev) => prev.map((x, i) => i === idx ? { ...x, reason_for_leaving: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                          <div className="space-y-2 md:col-span-2"><Label className="text-slate-200">Catatan</Label><Textarea rows={2} value={item.notes} onChange={(e) => setWorkHistories((prev) => prev.map((x, i) => i === idx ? { ...x, notes: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="portfolio" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">Portfolio/proyek yang pernah dikerjakan.</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-slate-700 text-slate-200"
                      onClick={() =>
                        setPortfolioItems((prev) => [...prev, { ...EMPTY_PORTFOLIO_ITEM }])
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Portfolio
                    </Button>
                  </div>
                  {portfolioItems.map((item, idx) => (
                    <div key={`portfolio-${idx}`} className="rounded-lg border border-slate-800 p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-200">Portfolio #{idx + 1}</p>
                        <Button type="button" size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setPortfolioItems((prev) => prev.length === 1 ? [{ ...EMPTY_PORTFOLIO_ITEM }] : prev.filter((_, i) => i !== idx))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label className="text-slate-200">Judul</Label><Input value={item.title} onChange={(e) => setPortfolioItems((prev) => prev.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                        <div className="space-y-2"><Label className="text-slate-200">Peran</Label><Input value={item.role} onChange={(e) => setPortfolioItems((prev) => prev.map((x, i) => i === idx ? { ...x, role: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                        <div className="space-y-2"><Label className="text-slate-200">Tahun</Label><Input type="number" min={1950} max={2100} value={item.year} onChange={(e) => setPortfolioItems((prev) => prev.map((x, i) => i === idx ? { ...x, year: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                        <div className="space-y-2"><Label className="text-slate-200">Link URL</Label><Input value={item.url} onChange={(e) => setPortfolioItems((prev) => prev.map((x, i) => i === idx ? { ...x, url: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" placeholder="https://..." /></div>
                        <div className="space-y-2 md:col-span-2"><Label className="text-slate-200">Deskripsi</Label><Textarea rows={3} value={item.description} onChange={(e) => setPortfolioItems((prev) => prev.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} className="bg-slate-950 border-slate-800 text-slate-100" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
              <Link href={`/hr/employees/${id}`}><Button type="button" variant="ghost" className="text-slate-400">Batal</Button></Link>
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : <><Save className="w-4 h-4 mr-2" />Simpan Perubahan</>}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
