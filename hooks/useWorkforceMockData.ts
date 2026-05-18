import type { WorkItem, EmployeeAllocation, WorkforceDashboardData, CommercialProject, DeliverySprint } from '@/types/workforce'

const now = new Date()
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString().slice(0, 10)
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000).toISOString().slice(0, 10)

// ============================================================
// EMPLOYEES
// ============================================================
export const mockEmployees = [
  { id: 'e1', fullName: 'Andi Pratama', position: 'Senior Developer', department: 'Engineering', photoUrl: '', email: 'andi@wit.id' },
  { id: 'e2', fullName: 'Budi Hartono', position: 'Developer', department: 'Engineering', photoUrl: '', email: 'budi@wit.id' },
  { id: 'e3', fullName: 'Citra Dewi', position: 'Junior Developer', department: 'Engineering', photoUrl: '', email: 'citra@wit.id' },
  { id: 'e4', fullName: 'Dian Permata', position: 'UI/UX Designer', department: 'Engineering', photoUrl: '', email: 'dian@wit.id' },
  { id: 'e5', fullName: 'Eko Saputra', position: 'QA Engineer', department: 'Engineering', photoUrl: '', email: 'eko@wit.id' },
  { id: 'e6', fullName: 'Fitri Handayani', position: 'Project Manager', department: 'Delivery', photoUrl: '', email: 'fitri@wit.id' },
  { id: 'e7', fullName: 'Gilang Ramadhan', position: 'Sales Manager', department: 'Commercial', photoUrl: '', email: 'gilang@wit.id' },
  { id: 'e8', fullName: 'Hana Susanti', position: 'HR Manager', department: 'Human Resources', photoUrl: '', email: 'hana@wit.id' },
  { id: 'e9', fullName: 'Indra Wijaya', position: 'Technical Lead', department: 'Engineering', photoUrl: '', email: 'indra@wit.id' },
  { id: 'e10', fullName: 'Julia Rahmawati', position: 'Business Analyst', department: 'Delivery', photoUrl: '', email: 'julia@wit.id' },
  { id: 'e11', fullName: 'Kevin Tan', position: 'Support Engineer', department: 'Support', photoUrl: '', email: 'kevin@wit.id' },
  { id: 'e12', fullName: 'Linda Kusuma', position: 'Account Manager', department: 'Commercial', photoUrl: '', email: 'linda@wit.id' },
]

// ============================================================
// WORK ITEMS
// ============================================================
export const mockWorkItems: WorkItem[] = [
  { id: 'wi-1', title: 'Develop user authentication API', type: 'project_task', priority: 'high', status: 'in_progress', project: 'WIT-ERP V2', projectId: 'p1', assignedTo: 'Andi Pratama', assignedToId: 'e1', dueDate: daysFromNow(3), estimatedHours: 24, actualHours: 18, progressPercent: 75, tags: ['backend', 'auth'], createdAt: daysAgo(14) },
  { id: 'wi-2', title: 'Design dashboard wireframe', type: 'project_task', priority: 'medium', status: 'review', project: 'Mobile App', projectId: 'p2', assignedTo: 'Dian Permata', assignedToId: 'e4', dueDate: daysFromNow(1), estimatedHours: 16, actualHours: 18, progressPercent: 95, tags: ['design', 'ui'], createdAt: daysAgo(10) },
  { id: 'wi-3', title: 'Fix login page responsive bug', type: 'support_task', priority: 'critical', status: 'in_progress', assignedTo: 'Budi Hartono', assignedToId: 'e2', dueDate: daysFromNow(1), estimatedHours: 4, actualHours: 2, progressPercent: 50, tags: ['bug', 'frontend'], createdAt: daysAgo(2) },
  { id: 'wi-4', title: 'Monthly payroll processing', type: 'operational_task', priority: 'high', status: 'in_progress', assignedTo: 'Hana Susanti', assignedToId: 'e8', dueDate: daysFromNow(2), estimatedHours: 16, actualHours: 10, progressPercent: 60, createdAt: daysAgo(5) },
  { id: 'wi-5', title: 'Database performance optimization', type: 'improvement_task', priority: 'medium', status: 'pending', project: 'WIT-ERP V2', projectId: 'p1', assignedTo: 'Indra Wijaya', assignedToId: 'e9', dueDate: daysFromNow(10), estimatedHours: 12, actualHours: 0, progressPercent: 0, tags: ['database', 'performance'], createdAt: daysAgo(3) },
  { id: 'wi-6', title: 'Production server outage', type: 'incident_task', priority: 'critical', status: 'in_progress', assignedTo: 'Kevin Tan', assignedToId: 'e11', dueDate: daysFromNow(0), estimatedHours: 8, actualHours: 5, progressPercent: 60, tags: ['infra', 'urgent'], createdAt: daysAgo(1) },
  { id: 'wi-7', title: 'Client proposal presentation', type: 'project_task', priority: 'high', status: 'done', project: 'ERP Implementation ABC', projectId: 'p3', assignedTo: 'Gilang Ramadhan', assignedToId: 'e7', dueDate: daysAgo(1), estimatedHours: 10, actualHours: 12, progressPercent: 100, tags: ['client', 'sales'], createdAt: daysAgo(7) },
  { id: 'wi-8', title: 'Employee leave report preparation', type: 'operational_task', priority: 'low', status: 'done', assignedTo: 'Hana Susanti', assignedToId: 'e8', dueDate: daysAgo(2), estimatedHours: 4, actualHours: 3, progressPercent: 100, createdAt: daysAgo(4) },
  { id: 'wi-9', title: 'Sprint retrospective notes', type: 'operational_task', priority: 'low', status: 'pending', assignedTo: 'Fitri Handayani', assignedToId: 'e6', dueDate: daysFromNow(5), estimatedHours: 2, actualHours: 0, progressPercent: 0, createdAt: daysAgo(0) },
  { id: 'wi-10', title: 'Unit test coverage for billing module', type: 'project_task', priority: 'medium', status: 'pending', project: 'WIT-ERP V2', projectId: 'p1', assignedTo: 'Budi Hartono', assignedToId: 'e2', dueDate: daysFromNow(7), estimatedHours: 20, actualHours: 0, progressPercent: 0, tags: ['testing'], createdAt: daysAgo(2) },
  { id: 'wi-11', title: 'User acceptance testing support', type: 'support_task', priority: 'medium', status: 'review', project: 'Mobile App', projectId: 'p2', assignedTo: 'Eko Saputra', assignedToId: 'e5', dueDate: daysFromNow(2), estimatedHours: 12, actualHours: 11, progressPercent: 90, tags: ['qa', 'uat'], createdAt: daysAgo(6) },
  { id: 'wi-12', title: 'Refactor legacy code module', type: 'improvement_task', priority: 'low', status: 'blocked', project: 'WIT-ERP V2', projectId: 'p1', assignedTo: 'Citra Dewi', assignedToId: 'e3', dueDate: daysFromNow(14), estimatedHours: 24, actualHours: 4, progressPercent: 15, tags: ['refactor', 'legacy'], createdAt: daysAgo(20) },
  { id: 'wi-13', title: 'Employee onboarding documentation', type: 'operational_task', priority: 'medium', status: 'in_progress', assignedTo: 'Julia Rahmawati', assignedToId: 'e10', dueDate: daysFromNow(4), estimatedHours: 8, actualHours: 3, progressPercent: 40, createdAt: daysAgo(3) },
  { id: 'wi-14', title: 'Security patch deployment', type: 'incident_task', priority: 'critical', status: 'done', assignedTo: 'Andi Pratama', assignedToId: 'e1', dueDate: daysAgo(1), estimatedHours: 6, actualHours: 4, progressPercent: 100, tags: ['security'], createdAt: daysAgo(3) },
  { id: 'wi-15', title: 'Client quarterly review meeting', type: 'project_task', priority: 'high', status: 'pending', project: 'ERP Implementation ABC', projectId: 'p3', assignedTo: 'Linda Kusuma', assignedToId: 'e12', dueDate: daysFromNow(6), estimatedHours: 3, actualHours: 0, progressPercent: 0, tags: ['client', 'meeting'], createdAt: daysAgo(1) },
  { id: 'wi-16', title: 'API rate limiting implementation', type: 'improvement_task', priority: 'medium', status: 'in_progress', project: 'WIT-ERP V2', projectId: 'p1', assignedTo: 'Indra Wijaya', assignedToId: 'e9', dueDate: daysFromNow(8), estimatedHours: 10, actualHours: 6, progressPercent: 55, tags: ['backend', 'security'], createdAt: daysAgo(4) },
  { id: 'wi-17', title: 'Help desk ticket triage', type: 'support_task', priority: 'high', status: 'in_progress', assignedTo: 'Kevin Tan', assignedToId: 'e11', dueDate: daysFromNow(0), estimatedHours: 8, actualHours: 6, progressPercent: 75, createdAt: daysAgo(1) },
  { id: 'wi-18', title: 'Mobile app push notification', type: 'project_task', priority: 'medium', status: 'review', project: 'Mobile App', projectId: 'p2', assignedTo: 'Citra Dewi', assignedToId: 'e3', dueDate: daysFromNow(2), estimatedHours: 12, actualHours: 14, progressPercent: 88, tags: ['mobile', 'notification'], createdAt: daysAgo(8) },
  { id: 'wi-19', title: 'Monthly financial report', type: 'operational_task', priority: 'high', status: 'done', assignedTo: 'Fitri Handayani', assignedToId: 'e6', dueDate: daysAgo(3), estimatedHours: 6, actualHours: 5, progressPercent: 100, createdAt: daysAgo(7) },
  { id: 'wi-20', title: 'New client requirements gathering', type: 'project_task', priority: 'high', status: 'in_progress', project: 'ERP Implementation ABC', projectId: 'p3', assignedTo: 'Julia Rahmawati', assignedToId: 'e10', dueDate: daysFromNow(5), estimatedHours: 16, actualHours: 8, progressPercent: 50, tags: ['client', 'analysis'], createdAt: daysAgo(3) },
]

// ============================================================
// EMPLOYEE ALLOCATIONS
// ============================================================
export const mockAllocations: EmployeeAllocation[] = [
  {
    id: 'a1', employeeId: 'e1', employeeName: 'Andi Pratama', position: 'Senior Developer', department: 'Engineering',
    allocations: [
      { projectId: 'p1', projectName: 'WIT-ERP V2', percentage: 80, type: 'project_task', hoursPerWeek: 32 },
      { projectName: 'Internal Tooling', percentage: 20, type: 'improvement_task', hoursPerWeek: 8 },
    ],
    totalAllocation: 100, status: 'optimal',
  },
  {
    id: 'a2', employeeId: 'e2', employeeName: 'Budi Hartono', position: 'Developer', department: 'Engineering',
    allocations: [
      { projectId: 'p1', projectName: 'WIT-ERP V2', percentage: 60, type: 'project_task', hoursPerWeek: 24 },
      { projectName: 'Support Rotation', percentage: 30, type: 'support_task', hoursPerWeek: 12 },
      { projectName: 'Ad-hoc Tasks', percentage: 30, type: 'operational_task', hoursPerWeek: 12 },
    ],
    totalAllocation: 120, status: 'critical',
  },
  {
    id: 'a3', employeeId: 'e3', employeeName: 'Citra Dewi', position: 'Junior Developer', department: 'Engineering',
    allocations: [
      { projectId: 'p2', projectName: 'Mobile App', percentage: 50, type: 'project_task', hoursPerWeek: 20 },
      { projectName: 'Learning & Development', percentage: 10, type: 'improvement_task', hoursPerWeek: 4 },
    ],
    totalAllocation: 60, status: 'underloaded',
  },
  {
    id: 'a4', employeeId: 'e4', employeeName: 'Dian Permata', position: 'UI/UX Designer', department: 'Engineering',
    allocations: [
      { projectId: 'p2', projectName: 'Mobile App', percentage: 70, type: 'project_task', hoursPerWeek: 28 },
      { projectId: 'p1', projectName: 'WIT-ERP V2', percentage: 20, type: 'project_task', hoursPerWeek: 8 },
    ],
    totalAllocation: 90, status: 'optimal',
  },
  {
    id: 'a5', employeeId: 'e5', employeeName: 'Eko Saputra', position: 'QA Engineer', department: 'Engineering',
    allocations: [
      { projectId: 'p1', projectName: 'WIT-ERP V2', percentage: 50, type: 'project_task', hoursPerWeek: 20 },
      { projectId: 'p2', projectName: 'Mobile App', percentage: 40, type: 'project_task', hoursPerWeek: 16 },
    ],
    totalAllocation: 90, status: 'optimal',
  },
  {
    id: 'a6', employeeId: 'e6', employeeName: 'Fitri Handayani', position: 'Project Manager', department: 'Delivery',
    allocations: [
      { projectId: 'p1', projectName: 'WIT-ERP V2', percentage: 50, type: 'project_task', hoursPerWeek: 20 },
      { projectId: 'p3', projectName: 'ERP Implementation ABC', percentage: 40, type: 'project_task', hoursPerWeek: 16 },
    ],
    totalAllocation: 90, status: 'optimal',
  },
  {
    id: 'a7', employeeId: 'e7', employeeName: 'Gilang Ramadhan', position: 'Sales Manager', department: 'Commercial',
    allocations: [
      { projectName: 'Lead Generation', percentage: 60, type: 'operational_task', hoursPerWeek: 24 },
      { projectName: 'Client Meetings', percentage: 30, type: 'operational_task', hoursPerWeek: 12 },
    ],
    totalAllocation: 90, status: 'optimal',
  },
  {
    id: 'a8', employeeId: 'e8', employeeName: 'Hana Susanti', position: 'HR Manager', department: 'Human Resources',
    allocations: [
      { projectName: 'HR Operations', percentage: 70, type: 'operational_task', hoursPerWeek: 28 },
      { projectName: 'Recruitment', percentage: 20, type: 'operational_task', hoursPerWeek: 8 },
    ],
    totalAllocation: 90, status: 'optimal',
  },
  {
    id: 'a9', employeeId: 'e9', employeeName: 'Indra Wijaya', position: 'Technical Lead', department: 'Engineering',
    allocations: [
      { projectId: 'p1', projectName: 'WIT-ERP V2', percentage: 60, type: 'project_task', hoursPerWeek: 24 },
      { projectName: 'Architecture Review', percentage: 20, type: 'improvement_task', hoursPerWeek: 8 },
      { projectName: 'Mentoring', percentage: 15, type: 'operational_task', hoursPerWeek: 6 },
    ],
    totalAllocation: 95, status: 'optimal',
  },
  {
    id: 'a10', employeeId: 'e10', employeeName: 'Julia Rahmawati', position: 'Business Analyst', department: 'Delivery',
    allocations: [
      { projectId: 'p3', projectName: 'ERP Implementation ABC', percentage: 70, type: 'project_task', hoursPerWeek: 28 },
      { projectName: 'Internal Process', percentage: 20, type: 'operational_task', hoursPerWeek: 8 },
    ],
    totalAllocation: 90, status: 'optimal',
  },
  {
    id: 'a11', employeeId: 'e11', employeeName: 'Kevin Tan', position: 'Support Engineer', department: 'Support',
    allocations: [
      { projectName: 'Ticket Resolution', percentage: 80, type: 'support_task', hoursPerWeek: 32 },
      { projectName: 'Documentation', percentage: 20, type: 'improvement_task', hoursPerWeek: 8 },
    ],
    totalAllocation: 100, status: 'optimal',
  },
  {
    id: 'a12', employeeId: 'e12', employeeName: 'Linda Kusuma', position: 'Account Manager', department: 'Commercial',
    allocations: [
      { projectId: 'p3', projectName: 'ERP Implementation ABC', percentage: 40, type: 'project_task', hoursPerWeek: 16 },
      { projectName: 'Account Management', percentage: 50, type: 'operational_task', hoursPerWeek: 20 },
    ],
    totalAllocation: 90, status: 'optimal',
  },
]

// ============================================================
// WORKFORCE DASHBOARD
// ============================================================
export const mockWorkforceDashboard: WorkforceDashboardData = {
  totalEmployees: 48,
  activeEmployees: 42,
  averageUtilization: 78,
  overloadedCount: 5,
  idleCount: 3,
  utilizationTrend: 4.2,
  departmentUtilization: [
    { department: 'Engineering', rate: 88, headcount: 18 },
    { department: 'Delivery', rate: 82, headcount: 8 },
    { department: 'Commercial', rate: 65, headcount: 6 },
    { department: 'Human Resources', rate: 72, headcount: 4 },
    { department: 'Support', rate: 76, headcount: 4 },
    { department: 'Finance', rate: 70, headcount: 3 },
  ],
  workItemSummary: {
    totalWorkItems: mockWorkItems.length,
    byType: {
      project_task: 8,
      operational_task: 5,
      support_task: 3,
      improvement_task: 3,
      incident_task: 1,
    },
    byStatus: {
      pending: 4,
      in_progress: 8,
      review: 3,
      done: 4,
      blocked: 1,
    },
    byPriority: {
      critical: 3,
      high: 7,
      medium: 6,
      low: 4,
    },
    overdueCount: 2,
    averageCompletionRate: 62,
  },
  recentActivities: [
    { id: 'act-1', employeeName: 'Andi Pratama', action: 'updated', item: 'User authentication API', time: '2 hours ago' },
    { id: 'act-2', employeeName: 'Kevin Tan', action: 'resolved', item: 'Production server outage', time: '3 hours ago' },
    { id: 'act-3', employeeName: 'Dian Permata', action: 'submitted for review', item: 'Dashboard wireframe', time: '4 hours ago' },
    { id: 'act-4', employeeName: 'Hana Susanti', action: 'completed', item: 'Employee leave report', time: '5 hours ago' },
    { id: 'act-5', employeeName: 'Budi Hartono', action: 'started', item: 'Login page responsive bug', time: '6 hours ago' },
  ],
}

// ============================================================
// COMMERCIAL PROJECTS
// ============================================================
export const mockCommercialProjects: CommercialProject[] = [
  {
    id: 'cp-1', clientName: 'Bank Mandiri', projectName: 'Digital Banking Platform', status: 'delivery', health: 'healthy', progressPercent: 65, milestoneProgress: 70, startDate: daysAgo(90), targetEndDate: daysFromNow(120), budget: 2000000000, actualCost: 1200000000, revenue: 2500000000, profitability: 35, pmName: 'Fitri Handayani', riskLevel: 'low', lastActivity: daysAgo(1),
  },
  {
    id: 'cp-2', clientName: 'Telkom Indonesia', projectName: 'Network Monitoring System', status: 'won', health: 'healthy', progressPercent: 15, milestoneProgress: 10, startDate: daysAgo(20), targetEndDate: daysFromNow(160), budget: 1500000000, actualCost: 200000000, revenue: 1800000000, profitability: 40, pmName: 'Fitri Handayani', riskLevel: 'low', lastActivity: daysAgo(2),
  },
  {
    id: 'cp-3', clientName: 'Gojek', projectName: 'Driver Analytics Dashboard', status: 'negotiation', health: 'at_risk', progressPercent: 0, milestoneProgress: 0, startDate: '', targetEndDate: '', budget: 0, actualCost: 0, revenue: 1200000000, profitability: 0, pmName: 'TBD', riskLevel: 'medium', lastActivity: daysAgo(3),
  },
  {
    id: 'cp-4', clientName: 'Shopee', projectName: 'Logistics Optimization', status: 'lead', health: 'healthy', progressPercent: 0, milestoneProgress: 0, startDate: '', targetEndDate: '', budget: 0, actualCost: 0, revenue: 3000000000, riskLevel: 'high', pmName: 'TBD', profitability: 0, lastActivity: daysAgo(5),
  },
  {
    id: 'cp-5', clientName: 'Bukalapak', projectName: 'Vendor Management System', status: 'delivery', health: 'critical', progressPercent: 40, milestoneProgress: 35, startDate: daysAgo(60), targetEndDate: daysFromNow(30), budget: 800000000, actualCost: 600000000, revenue: 1000000000, profitability: 20, pmName: 'Fitri Handayani', riskLevel: 'high', lastActivity: daysAgo(0),
  },
  {
    id: 'cp-6', clientName: 'Tokopedia', projectName: 'Payment Gateway Integration', status: 'completed', health: 'healthy', progressPercent: 100, milestoneProgress: 100, startDate: daysAgo(180), targetEndDate: daysAgo(10), budget: 500000000, actualCost: 450000000, revenue: 650000000, profitability: 30, pmName: 'Fitri Handayani', riskLevel: 'low', lastActivity: daysAgo(10),
  },
]

// ============================================================
// DELIVERY SPRINTS
// ============================================================
export const mockDeliverySprints: DeliverySprint[] = [
  { id: 's1', projectId: 'p1', projectName: 'WIT-ERP V2', sprintName: 'Sprint 5', startDate: daysAgo(10), endDate: daysFromNow(4), status: 'active', totalTasks: 12, completedTasks: 6, blockedTasks: 1, progressPercent: 50 },
  { id: 's2', projectId: 'p2', projectName: 'Mobile App', sprintName: 'Sprint 3', startDate: daysAgo(10), endDate: daysFromNow(4), status: 'active', totalTasks: 8, completedTasks: 5, blockedTasks: 0, progressPercent: 62 },
  { id: 's3', projectId: 'p1', projectName: 'WIT-ERP V2', sprintName: 'Sprint 4', startDate: daysAgo(24), endDate: daysAgo(10), status: 'completed', totalTasks: 14, completedTasks: 12, blockedTasks: 0, progressPercent: 86 },
  { id: 's4', projectId: 'p3', projectName: 'ERP Implementation ABC', sprintName: 'Sprint 1', startDate: daysFromNow(5), endDate: daysFromNow(20), status: 'planning', totalTasks: 0, completedTasks: 0, blockedTasks: 0, progressPercent: 0 },
]

// ============================================================
// UTILIZATION HISTORY (for charts)
// ============================================================
export const mockUtilizationHistory = [
  { month: 'Jan', utilization: 72, billable: 58, nonBillable: 14 },
  { month: 'Feb', utilization: 75, billable: 60, nonBillable: 15 },
  { month: 'Mar', utilization: 71, billable: 55, nonBillable: 16 },
  { month: 'Apr', utilization: 78, billable: 62, nonBillable: 16 },
  { month: 'May', utilization: 76, billable: 61, nonBillable: 15 },
  { month: 'Jun', utilization: 82, billable: 68, nonBillable: 14 },
  { month: 'Jul', utilization: 79, billable: 63, nonBillable: 16 },
  { month: 'Aug', utilization: 84, billable: 70, nonBillable: 14 },
  { month: 'Sep', utilization: 81, billable: 65, nonBillable: 16 },
  { month: 'Oct', utilization: 78, billable: 62, nonBillable: 16 },
  { month: 'Nov', utilization: 76, billable: 60, nonBillable: 16 },
  { month: 'Dec', utilization: 74, billable: 56, nonBillable: 18 },
]
