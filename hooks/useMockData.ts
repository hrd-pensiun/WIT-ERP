/**
 * useMockData - Mock data provider for offline/demo mode
 * No database required - works with static export
 */

import { useState, useCallback, useEffect } from 'react'

// Mock data generators
const generateId = () => Math.random().toString(36).substring(2, 15)

const now = new Date().toISOString()

// Mock Entities
export const mockEntities = [
  { id: '1', tenant_id: 'demo', code: 'WIT', name: 'PT WIT Teknologi', description: 'Head Office', status: 'active', created_at: now },
  { id: '2', tenant_id: 'demo', code: 'WIT-SBY', name: 'WIT Surabaya', description: 'Branch Office', status: 'active', created_at: now },
]

// Mock Departments
export const mockDepartments = [
  { id: '1', tenant_id: 'demo', entity_id: '1', code: 'ENG', name: 'Engineering', description: 'Software Development', cost_center: 'CC-001', status: 'active', created_at: now },
  { id: '2', tenant_id: 'demo', entity_id: '1', code: 'SALES', name: 'Sales', description: 'Business Development', cost_center: 'CC-002', status: 'active', created_at: now },
  { id: '3', tenant_id: 'demo', entity_id: '1', code: 'HR', name: 'Human Resources', description: 'HR & Recruitment', cost_center: 'CC-003', status: 'active', created_at: now },
]

// Mock Job Grades
export const mockJobGrades = [
  { id: '1', tenant_id: 'demo', code: 'JG1', name: 'Junior', level: 1, min_salary: 5000000, max_salary: 8000000, description: 'Entry level', status: 'active', created_at: now },
  { id: '2', tenant_id: 'demo', code: 'JG2', name: 'Mid', level: 2, min_salary: 8000000, max_salary: 15000000, description: 'Mid level', status: 'active', created_at: now },
  { id: '3', tenant_id: 'demo', code: 'JG3', name: 'Senior', level: 3, min_salary: 15000000, max_salary: 25000000, description: 'Senior level', status: 'active', created_at: now },
]

// Mock Employees
export const mockEmployees = [
  { id: '1', tenant_id: 'demo', employee_number: 'EMP-001', full_name: 'Budi Santoso', email: 'budi@wit.id', phone: '081234567890', department_id: '1', job_grade_id: '3', employment_type: 'permanent', join_date: '2023-01-15', status: 'active', created_at: now },
  { id: '2', tenant_id: 'demo', employee_number: 'EMP-002', full_name: 'Siti Rahma', email: 'siti@wit.id', phone: '081234567891', department_id: '3', job_grade_id: '2', employment_type: 'permanent', join_date: '2023-03-20', status: 'active', created_at: now },
  { id: '3', tenant_id: 'demo', employee_number: 'EMP-003', full_name: 'Ahmad Rizky', email: 'ahmad@wit.id', phone: '081234567892', department_id: '1', job_grade_id: '1', employment_type: 'contract', join_date: '2024-01-10', status: 'active', created_at: now },
  { id: '4', tenant_id: 'demo', employee_number: 'EMP-004', full_name: 'Dewi Lestari', email: 'dewi@wit.id', phone: '081234567893', department_id: '2', job_grade_id: '2', employment_type: 'permanent', join_date: '2023-06-01', status: 'active', created_at: now },
  { id: '5', tenant_id: 'demo', employee_number: 'EMP-005', full_name: 'Rudi Hartono', email: 'rudi@wit.id', phone: '081234567894', department_id: '2', job_grade_id: '3', employment_type: 'permanent', join_date: '2022-11-15', status: 'active', created_at: now },
]

// Mock CRM Leads
export const mockLeads = [
  { id: '1', tenant_id: 'demo', contact_name: 'John Doe', company_name: 'ABC Corp', contact_email: 'john@abc.com', contact_phone: '0215551234', lead_source: 'website', status: 'qualified', priority: 'high', bant_score: 75, estimated_value: 500000000, created_at: now },
  { id: '2', tenant_id: 'demo', contact_name: 'Jane Smith', company_name: 'XYZ Ltd', contact_email: 'jane@xyz.com', contact_phone: '0215555678', lead_source: 'referral', status: 'new', priority: 'medium', bant_score: 50, estimated_value: 300000000, created_at: now },
  { id: '3', tenant_id: 'demo', contact_name: 'Bob Johnson', company_name: 'Tech Solutions', contact_email: 'bob@tech.com', contact_phone: '0215559012', lead_source: 'social_media', status: 'contacted', priority: 'low', bant_score: 25, estimated_value: 150000000, created_at: now },
]

// Mock Opportunities
export const mockOpportunities = [
  { id: '1', tenant_id: 'demo', lead_id: '1', title: 'ERP Implementation ABC', description: 'Full ERP deployment', value: 500000000, currency: 'IDR', stage: 'negotiation', probability: 80, expected_close_date: '2026-06-30', created_at: now },
  { id: '2', tenant_id: 'demo', lead_id: '2', title: 'HR Module XYZ', description: 'HR management system', value: 300000000, currency: 'IDR', stage: 'proposal', probability: 40, expected_close_date: '2026-05-15', created_at: now },
  { id: '3', tenant_id: 'demo', title: 'Custom Development', description: 'Mobile app development', value: 200000000, currency: 'IDR', stage: 'discovery', probability: 20, expected_close_date: '2026-07-30', created_at: now },
  { id: '4', tenant_id: 'demo', title: 'Maintenance Contract', description: 'Annual maintenance', value: 100000000, currency: 'IDR', stage: 'won', probability: 100, actual_close_date: '2026-03-15', created_at: now },
]

// Mock Projects
export const mockProjects = [
  { id: '1', tenant_id: 'demo', project_code: 'PRJ-001', project_name: 'WIT-ERP V2', description: 'ERP system modernization', status: 'active', health: 'green', progress_percent: 75, priority: 'high', created_at: now },
  { id: '2', tenant_id: 'demo', project_code: 'PRJ-002', project_name: 'Mobile App', description: 'Customer mobile application', status: 'active', health: 'yellow', progress_percent: 45, priority: 'medium', created_at: now },
  { id: '3', tenant_id: 'demo', project_code: 'PRJ-003', project_name: 'Data Migration', description: 'Legacy data migration', status: 'completed', health: 'green', progress_percent: 100, priority: 'high', created_at: now },
]

// Mock Tasks
export const mockTasks = [
  { id: '1', tenant_id: 'demo', project_id: '1', title: 'Setup database', description: 'Configure PostgreSQL', status: 'done', priority: 'high', progress_percent: 100, estimated_hours: 8, actual_hours: 6, created_at: now },
  { id: '2', tenant_id: 'demo', project_id: '1', title: 'API development', description: 'REST API endpoints', status: 'in_progress', priority: 'high', progress_percent: 60, estimated_hours: 40, actual_hours: 24, created_at: now },
  { id: '3', tenant_id: 'demo', project_id: '1', title: 'Frontend UI', description: 'React components', status: 'in_progress', priority: 'medium', progress_percent: 40, estimated_hours: 32, actual_hours: 12, created_at: now },
  { id: '4', tenant_id: 'demo', project_id: '1', title: 'Testing', description: 'Unit & integration tests', status: 'todo', priority: 'medium', progress_percent: 0, estimated_hours: 16, actual_hours: 0, created_at: now },
  { id: '5', tenant_id: 'demo', project_id: '2', title: 'UI Design', description: 'Mobile app design', status: 'review', priority: 'high', progress_percent: 90, estimated_hours: 24, actual_hours: 22, created_at: now },
]

// Mock BOPP Formulas
export const mockBoppFormulas = [
  { id: '1', tenant_id: 'demo', name: 'Standard Project', code: 'STD', marketing_percent: 10, se_percent: 15, management_percent: 20, tech_percent: 35, operational_percent: 10, is_default: true, status: 'active', created_at: now },
  { id: '2', tenant_id: 'demo', name: 'Enterprise Deal', code: 'ENT', marketing_percent: 8, se_percent: 12, management_percent: 25, tech_percent: 30, operational_percent: 15, is_default: false, status: 'active', created_at: now },
]

// Mock Salary Components
export const mockSalaryComponents = [
  { id: '1', tenant_id: 'demo', code: 'GP', name: 'Gaji Pokok', type: 'earning', calculation_type: 'fixed', is_taxable: true, is_fixed: true, include_in_thp: true, status: 'active', created_at: now },
  { id: '2', tenant_id: 'demo', code: 'TJ', name: 'Tunjangan Jabatan', type: 'earning', calculation_type: 'fixed', is_taxable: true, is_fixed: true, include_in_thp: true, status: 'active', created_at: now },
  { id: '3', tenant_id: 'demo', code: 'TP', name: 'Tunjangan Transport', type: 'earning', calculation_type: 'attendance_based', is_taxable: false, is_fixed: false, include_in_thp: true, status: 'active', created_at: now },
  { id: '4', tenant_id: 'demo', code: 'BPJS', name: 'BPJS Kesehatan', type: 'deduction', calculation_type: 'fixed', is_taxable: false, is_fixed: true, include_in_thp: false, status: 'active', created_at: now },
]

// Generic hook for mock CRUD operations
export function useMockData<T>(initialData: T[], storageKey: string) {
  const [data, setData] = useState<T[]>(initialData)
  const [loading, setLoading] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        setData(JSON.parse(stored))
      } catch {
        localStorage.removeItem(storageKey)
      }
    }
  }, [storageKey])

  // Save to localStorage
  const saveToStorage = useCallback((newData: T[]) => {
    localStorage.setItem(storageKey, JSON.stringify(newData))
  }, [storageKey])

  const fetchAll = useCallback(() => {
    setLoading(true)
    setTimeout(() => setLoading(false), 300) // Simulate delay
    return data
  }, [data])

  const create = useCallback((item: Omit<T, 'id'>) => {
    const newItem = { ...item, id: generateId() } as T
    const newData = [...data, newItem]
    setData(newData)
    saveToStorage(newData)
    return newItem
  }, [data, saveToStorage])

  const update = useCallback((id: string, updates: Partial<T>) => {
    const newData = data.map(item => (item as any).id === id ? { ...item, ...updates } : item)
    setData(newData)
    saveToStorage(newData)
    return newData.find(item => (item as any).id === id)
  }, [data, saveToStorage])

  const remove = useCallback((id: string) => {
    const newData = data.filter(item => (item as any).id !== id)
    setData(newData)
    saveToStorage(newData)
    return true
  }, [data, saveToStorage])

  return { data, loading, fetchAll, create, update, remove }
}
