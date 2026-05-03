/**
 * WIT-ERP Extended Database Types (Sprint 2)
 * HR + CRM + Project + Finance modules
 */

import type { Database as BaseDatabase } from './database'

export interface DatabaseExtended extends BaseDatabase {
  public: {
    Tables: BaseDatabase['public']['Tables'] & {
      // HR Module
      user_profiles: {
        Row: {
          id: string
          user_id: string | null
          tenant_id: string
          entity_id: string | null
          department_id: string | null
          division_id: string | null
          position_id: string | null
          job_grade_id: string | null
          work_shift_id: string | null
          employee_number: string
          full_name: string
          email: string | null
          phone: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          address: string | null
          city: string | null
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other' | null
          religion: string | null
          blood_type: string | null
          marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null
          npwp: string | null
          ptkp_status: string
          tax_position: string
          bpjs_tk_number: string | null
          bpjs_kes_number: string | null
          bank_name: string | null
          bank_account_number: string | null
          bank_account_name: string | null
          employment_type: 'permanent' | 'contract' | 'freelance' | 'intern'
          join_date: string
          end_date: string | null
          probation_end_date: string | null
          resignation_date: string | null
          status: 'active' | 'inactive' | 'resigned' | 'terminated'
          profile_photo_url: string | null
          documents: Record<string, unknown>
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: Omit<DatabaseExtended['public']['Tables']['user_profiles']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<DatabaseExtended['public']['Tables']['user_profiles']['Insert']>
      }
      
      employee_allowances: {
        Row: {
          id: string
          tenant_id: string
          user_profile_id: string
          salary_component_id: string
          amount: number
          effective_date: string
          end_date: string | null
          notes: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: Omit<DatabaseExtended['public']['Tables']['employee_allowances']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<DatabaseExtended['public']['Tables']['employee_allowances']['Insert']>
      }
      
      attendance_records: {
        Row: {
          id: string
          tenant_id: string
          user_profile_id: string
          entity_id: string | null
          work_shift_id: string | null
          date: string
          check_in: string | null
          check_out: string | null
          check_in_lat: number | null
          check_in_lng: number | null
          check_out_lat: number | null
          check_out_lng: number | null
          check_in_status: 'on_time' | 'late' | 'early' | null
          check_out_status: 'on_time' | 'overtime' | 'early' | null
          work_hours: number | null
          overtime_hours: number
          is_holiday: boolean
          is_leave: boolean
          leave_type_id: string | null
          notes: string | null
          status: 'present' | 'absent' | 'late' | 'leave' | 'sick' | 'permission'
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: Omit<DatabaseExtended['public']['Tables']['attendance_records']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<DatabaseExtended['public']['Tables']['attendance_records']['Insert']>
      }
      
      leave_requests: {
        Row: {
          id: string
          tenant_id: string
          user_profile_id: string
          leave_type_id: string
          start_date: string
          end_date: string
          days_requested: number
          reason: string | null
          attachment_url: string | null
          status: 'pending' | 'approved' | 'rejected' | 'cancelled'
          approved_by: string | null
          approved_at: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: Omit<DatabaseExtended['public']['Tables']['leave_requests']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<DatabaseExtended['public']['Tables']['leave_requests']['Insert']>
      }
      
      // CRM Module
      crm_leads: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string | null
          lead_source: string | null
          lead_source_detail: string | null
          campaign_id: string | null
          company_name: string | null
          industry: string | null
          company_size: string | null
          company_website: string | null
          contact_name: string
          contact_email: string | null
          contact_phone: string | null
          contact_position: string | null
          budget_confirmed: boolean
          authority_confirmed: boolean
          need_confirmed: boolean
          timeline_confirmed: boolean
          bant_score: number
          pic_sales_id: string | null
          se_assigned_id: string | null
          status: string
          priority: string
          estimated_value: number | null
          currency: string
          probability: number
          expected_close_date: string | null
          notes: string | null
          last_activity_at: string | null
          next_follow_up: string | null
          product_interest: unknown[]
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: Omit<DatabaseExtended['public']['Tables']['crm_leads']['Row'], 'id' | 'created_at' | 'updated_at' | 'bant_score'> & { id?: string; bant_score?: number }
        Update: Partial<DatabaseExtended['public']['Tables']['crm_leads']['Insert']>
      }
      
      crm_opportunities: {
        Row: {
          id: string
          tenant_id: string
          lead_id: string | null
          title: string
          description: string | null
          value: number | null
          currency: string
          category_id: string | null
          custom_formula: Record<string, unknown> | null
          expected_start_date: string | null
          expected_duration_months: number | null
          expected_close_date: string | null
          actual_close_date: string | null
          stage: string
          probability: number
          pic_sales_id: string | null
          se_assigned_id: string | null
          loss_reason: string | null
          loss_reason_detail: string | null
          competitor_name: string | null
          bopp_formula_id: string | null
          estimated_bopp_amount: number | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: Omit<DatabaseExtended['public']['Tables']['crm_opportunities']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<DatabaseExtended['public']['Tables']['crm_opportunities']['Insert']>
      }
      
      products: {
        Row: {
          id: string
          tenant_id: string
          code: string
          name: string
          description: string | null
          base_price: number | null
          cost_estimate: number | null
          category_id: string | null
          product_type: string
          is_recurring: boolean
          billing_frequency: string | null
          has_custom_formula: boolean
          custom_formula: Record<string, unknown> | null
          status: string
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: Omit<DatabaseExtended['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<DatabaseExtended['public']['Tables']['products']['Insert']>
      }
      
      // Project Module
      projects: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string | null
          project_code: string
          project_name: string
          description: string | null
          opportunity_id: string | null
          client_name: string | null
          client_email: string | null
          client_phone: string | null
          project_manager_id: string | null
          start_date: string | null
          target_end_date: string | null
          actual_end_date: string | null
          status: string
          health: string
          budget: number | null
          estimated_cost: number | null
          actual_cost: number
          billing_type: string
          total_billable_amount: number
          total_billed_amount: number
          bopp_formula_id: string | null
          bopp_amount: number
          bopp_distributed: boolean
          priority: string
          progress_percent: number
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: Omit<DatabaseExtended['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<DatabaseExtended['public']['Tables']['projects']['Insert']>
      }
      
      project_tasks: {
        Row: {
          id: string
          tenant_id: string
          project_id: string
          parent_task_id: string | null
          task_code: string | null
          title: string
          description: string | null
          assigned_to: string | null
          reviewer_id: string | null
          start_date: string | null
          due_date: string | null
          completed_at: string | null
          estimated_hours: number | null
          actual_hours: number
          billable_hours: number
          status: string
          priority: string
          progress_percent: number
          task_type: string
          is_recurring: boolean
          recurrence_rule: string | null
          sort_order: number
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: Omit<DatabaseExtended['public']['Tables']['project_tasks']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<DatabaseExtended['public']['Tables']['project_tasks']['Insert']>
      }
      
      time_entries: {
        Row: {
          id: string
          tenant_id: string
          user_profile_id: string
          project_id: string | null
          task_id: string | null
          entry_date: string
          start_time: string
          end_time: string | null
          duration_minutes: number | null
          description: string | null
          is_billable: boolean
          is_approved: boolean
          approved_by: string | null
          approved_at: string | null
          is_overtime: boolean
          overtime_multiplier: number
          status: string
          rejection_reason: string | null
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: Omit<DatabaseExtended['public']['Tables']['time_entries']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<DatabaseExtended['public']['Tables']['time_entries']['Insert']>
      }
      
      // Finance Module
      invoices: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string | null
          invoice_number: string
          invoice_date: string
          due_date: string
          customer_name: string
          customer_email: string | null
          customer_address: string | null
          customer_npwp: string | null
          project_id: string | null
          opportunity_id: string | null
          subtotal: number
          discount_amount: number
          tax_amount: number
          tax_percent: number
          total_amount: number
          paid_amount: number
          balance_due: number
          status: string
          payment_terms: string
          last_reminder_sent_at: string | null
          bopp_distribution_id: string | null
          notes: string | null
          terms_and_conditions: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          updated_by: string | null
        }
        Insert: Omit<DatabaseExtended['public']['Tables']['invoices']['Row'], 'id' | 'created_at' | 'updated_at' | 'balance_due'> & { id?: string }
        Update: Partial<DatabaseExtended['public']['Tables']['invoices']['Insert']>
      }
      
      expenses: {
        Row: {
          id: string
          tenant_id: string
          entity_id: string | null
          expense_date: string
          category: string
          description: string
          amount: number
          tax_amount: number
          total_amount: number
          vendor_name: string | null
          vendor_tax_id: string | null
          receipt_number: string | null
          receipt_url: string | null
          project_id: string | null
          allocation_percent: number
          payment_status: string
          paid_amount: number
          is_billable: boolean
          is_billed: boolean
          invoice_id: string | null
          submitted_by: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          updated_by: string | null
        }
        Insert: Omit<DatabaseExtended['public']['Tables']['expenses']['Row'], 'id' | 'created_at' | 'updated_at' | 'total_amount'> & { id?: string }
        Update: Partial<DatabaseExtended['public']['Tables']['expenses']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

// Re-export types
export type Tables = DatabaseExtended['public']['Tables']

export type UserProfile = Tables['user_profiles']['Row']
export type UserProfileInsert = Tables['user_profiles']['Insert']

export type EmployeeAllowance = Tables['employee_allowances']['Row']
export type AttendanceRecord = Tables['attendance_records']['Row']
export type LeaveRequest = Tables['leave_requests']['Row']

export type CRMLead = Tables['crm_leads']['Row']
export type CRMOpportunity = Tables['crm_opportunities']['Row']
export type Product = Tables['products']['Row']

export type Project = Tables['projects']['Row']
export type ProjectTask = Tables['project_tasks']['Row']
export type TimeEntry = Tables['time_entries']['Row']

export type Invoice = Tables['invoices']['Row']
export type Expense = Tables['expenses']['Row']
