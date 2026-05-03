/**
 * WIT-ERP Database Types
 * Generated manually for Sprint 1: Master Data
 * Update this file as schema evolves
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // ============================================
      // MASTER DATA TABLES
      // ============================================
      
      entities: {
        Row: {
          id: string
          tenant_id: string
          code: string
          name: string
          type: 'branch' | 'unit_business' | 'subsidiary'
          address: string | null
          city: string | null
          province: string | null
          phone: string | null
          email: string | null
          npwp: string | null
          bpjs_tk_number: string | null
          bpjs_kes_number: string | null
          latitude: number | null
          longitude: number | null
          radius_meters: number
          grace_period_minutes: number
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          code: string
          name: string
          type?: 'branch' | 'unit_business' | 'subsidiary'
          address?: string | null
          city?: string | null
          province?: string | null
          phone?: string | null
          email?: string | null
          npwp?: string | null
          bpjs_tk_number?: string | null
          bpjs_kes_number?: string | null
          latitude?: number | null
          longitude?: number | null
          radius_meters?: number
          grace_period_minutes?: number
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          code?: string
          name?: string
          type?: 'branch' | 'unit_business' | 'subsidiary'
          address?: string | null
          city?: string | null
          province?: string | null
          phone?: string | null
          email?: string | null
          npwp?: string | null
          bpjs_tk_number?: string | null
          bpjs_kes_number?: string | null
          latitude?: number | null
          longitude?: number | null
          radius_meters?: number
          grace_period_minutes?: number
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
      
      departments: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string | null
          code: string
          name: string
          description: string | null
          manager_id: string | null
          cost_center: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          entity_id?: string | null
          code: string
          name: string
          description?: string | null
          manager_id?: string | null
          cost_center?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          entity_id?: string | null
          code?: string
          name?: string
          description?: string | null
          manager_id?: string | null
          cost_center?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
      
      divisions: {
        Row: {
          id: string
          tenant_id: string
          department_id: string
          code: string
          name: string
          description: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          department_id: string
          code: string
          name: string
          description?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          department_id?: string
          code?: string
          name?: string
          description?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
      
      hr_positions: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string | null
          job_grade_id: string | null
          code: string
          name: string
          level: number
          description: string | null
          responsibilities: string[] | null
          requirements: string[] | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          entity_id?: string | null
          job_grade_id?: string | null
          code: string
          name: string
          level?: number
          description?: string | null
          responsibilities?: string[] | null
          requirements?: string[] | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          entity_id?: string | null
          job_grade_id?: string | null
          code?: string
          name?: string
          level?: number
          description?: string | null
          responsibilities?: string[] | null
          requirements?: string[] | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
      
      hr_job_grades: {
        Row: {
          id: string
          tenant_id: string
          code: string
          name: string
          level: number
          description: string | null
          min_salary: number | null
          max_salary: number | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          code: string
          name: string
          level: number
          description?: string | null
          min_salary?: number | null
          max_salary?: number | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          code?: string
          name?: string
          level?: number
          description?: string | null
          min_salary?: number | null
          max_salary?: number | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
      
      salary_components: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string | null
          code: string
          name: string
          type: 'earning' | 'deduction'
          is_taxable: boolean
          is_fixed: boolean
          default_amount: number
          calculation_type: 'fixed' | 'percentage' | 'formula'
          affects_thp: boolean
          affects_topp: boolean
          description: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          entity_id?: string | null
          code: string
          name: string
          type?: 'earning' | 'deduction'
          is_taxable?: boolean
          is_fixed?: boolean
          default_amount?: number
          calculation_type?: 'fixed' | 'percentage' | 'formula'
          affects_thp?: boolean
          affects_topp?: boolean
          description?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          entity_id?: string | null
          code?: string
          name?: string
          type?: 'earning' | 'deduction'
          is_taxable?: boolean
          is_fixed?: boolean
          default_amount?: number
          calculation_type?: 'fixed' | 'percentage' | 'formula'
          affects_thp?: boolean
          affects_topp?: boolean
          description?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
      
      salary_matrix: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string | null
          job_grade_id: string
          step: number
          amount: number
          effective_date: string
          end_date: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          entity_id?: string | null
          job_grade_id: string
          step: number
          amount: number
          effective_date?: string
          end_date?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          entity_id?: string | null
          job_grade_id?: string
          step?: number
          amount?: number
          effective_date?: string
          end_date?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
      
      hr_work_shifts: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string | null
          code: string
          name: string
          start_time: string
          end_time: string
          grace_period_minutes: number
          break_duration_minutes: number
          is_night_shift: boolean
          description: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          entity_id?: string | null
          code: string
          name: string
          start_time: string
          end_time: string
          grace_period_minutes?: number
          break_duration_minutes?: number
          is_night_shift?: boolean
          description?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          entity_id?: string | null
          code?: string
          name?: string
          start_time?: string
          end_time?: string
          grace_period_minutes?: number
          break_duration_minutes?: number
          is_night_shift?: boolean
          description?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
      
      hr_work_calendars: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string | null
          date: string
          is_holiday: boolean
          holiday_name: string | null
          holiday_type: 'national' | 'company' | 'cuti_bersama' | null
          work_shift_id: string | null
          description: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          entity_id?: string | null
          date: string
          is_holiday?: boolean
          holiday_name?: string | null
          holiday_type?: 'national' | 'company' | 'cuti_bersama' | null
          work_shift_id?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          entity_id?: string | null
          date?: string
          is_holiday?: boolean
          holiday_name?: string | null
          holiday_type?: 'national' | 'company' | 'cuti_bersama' | null
          work_shift_id?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
      
      hr_leave_types: {
        Row: {
          id: string
          tenant_id: string
          code: string
          name: string
          days_per_year: number
          carry_over_allowed: boolean
          max_carry_over_days: number
          min_service_months: number
          is_paid: boolean
          requires_approval: boolean
          approval_levels: number
          description: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          code: string
          name: string
          days_per_year?: number
          carry_over_allowed?: boolean
          max_carry_over_days?: number
          min_service_months?: number
          is_paid?: boolean
          requires_approval?: boolean
          approval_levels?: number
          description?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          code?: string
          name?: string
          days_per_year?: number
          carry_over_allowed?: boolean
          max_carry_over_days?: number
          min_service_months?: number
          is_paid?: boolean
          requires_approval?: boolean
          approval_levels?: number
          description?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
      
      bopp_categories: {
        Row: {
          id: string
          tenant_id: string
          code: string
          name: string
          description: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          code: string
          name: string
          description?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          code?: string
          name?: string
          description?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
      
      bopp_formulas: {
        Row: {
          id: string
          tenant_id: string
          category_id: string | null
          name: string
          is_default: boolean
          marketing_percent: number
          se_percent: number
          management_percent: number
          tech_percent: number
          operational_percent: number
          description: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          category_id?: string | null
          name: string
          is_default?: boolean
          marketing_percent?: number
          se_percent?: number
          management_percent?: number
          tech_percent?: number
          operational_percent?: number
          description?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          category_id?: string | null
          name?: string
          is_default?: boolean
          marketing_percent?: number
          se_percent?: number
          management_percent?: number
          tech_percent?: number
          operational_percent?: number
          description?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
        }
      }
    }
    
    Views: {}
    Functions: {}
    Enums: {}
  }
}

// Helper types for common operations
type Tables = Database['public']['Tables']

export type Entity = Tables['entities']['Row']
export type EntityInsert = Tables['entities']['Insert']
export type EntityUpdate = Tables['entities']['Update']

export type Department = Tables['departments']['Row']
export type DepartmentInsert = Tables['departments']['Insert']
export type DepartmentUpdate = Tables['departments']['Update']

export type Division = Tables['divisions']['Row']
export type DivisionInsert = Tables['divisions']['Insert']
export type DivisionUpdate = Tables['divisions']['Update']

export type HRPosition = Tables['hr_positions']['Row']
export type HRPositionInsert = Tables['hr_positions']['Insert']
export type HRPositionUpdate = Tables['hr_positions']['Update']

export type HRJobGrade = Tables['hr_job_grades']['Row']
export type HRJobGradeInsert = Tables['hr_job_grades']['Insert']
export type HRJobGradeUpdate = Tables['hr_job_grades']['Update']

export type SalaryComponent = Tables['salary_components']['Row']
export type SalaryComponentInsert = Tables['salary_components']['Insert']
export type SalaryComponentUpdate = Tables['salary_components']['Update']

export type SalaryMatrix = Tables['salary_matrix']['Row']
export type SalaryMatrixInsert = Tables['salary_matrix']['Insert']
export type SalaryMatrixUpdate = Tables['salary_matrix']['Update']

export type WorkShift = Tables['hr_work_shifts']['Row']
export type WorkShiftInsert = Tables['hr_work_shifts']['Insert']
export type WorkShiftUpdate = Tables['hr_work_shifts']['Update']

export type WorkCalendar = Tables['hr_work_calendars']['Row']
export type WorkCalendarInsert = Tables['hr_work_calendars']['Insert']
export type WorkCalendarUpdate = Tables['hr_work_calendars']['Update']

export type LeaveType = Tables['hr_leave_types']['Row']
export type LeaveTypeInsert = Tables['hr_leave_types']['Insert']
export type LeaveTypeUpdate = Tables['hr_leave_types']['Update']

export type BOPPCategory = Tables['bopp_categories']['Row']
export type BOPPCategoryInsert = Tables['bopp_categories']['Insert']
export type BOPPCategoryUpdate = Tables['bopp_categories']['Update']

export type BOPPFormula = Tables['bopp_formulas']['Row']
export type BOPPFormulaInsert = Tables['bopp_formulas']['Insert']
export type BOPPFormulaUpdate = Tables['bopp_formulas']['Update']
