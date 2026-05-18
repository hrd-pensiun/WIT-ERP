// Work Item & Workforce Management Types

export type WorkItemType =
  | 'project_task'
  | 'operational_task'
  | 'support_task'
  | 'improvement_task'
  | 'incident_task'

export type WorkItemPriority = 'critical' | 'high' | 'medium' | 'low'
export type WorkItemStatus = 'pending' | 'in_progress' | 'review' | 'done' | 'blocked'

export interface WorkItem {
  id: string
  title: string
  description?: string
  type: WorkItemType
  priority: WorkItemPriority
  status: WorkItemStatus
  project?: string
  projectId?: string
  assignedTo: string
  assignedToId: string
  dueDate: string
  estimatedHours: number
  actualHours: number
  progressPercent: number
  tags?: string[]
  createdAt: string
}

export interface EmployeeAllocation {
  id: string
  employeeId: string
  employeeName: string
  position: string
  department: string
  photoUrl?: string
  allocations: {
    projectId?: string
    projectName: string
    percentage: number
    type: WorkItemType
    hoursPerWeek: number
  }[]
  totalAllocation: number // percentage
  status: 'underloaded' | 'optimal' | 'overloaded' | 'critical'
}

export interface UtilizationMetric {
  employeeId: string
  employeeName: string
  billableHours: number
  nonBillableHours: number
  totalAvailableHours: number
  utilizationRate: number // percentage
  trend: 'up' | 'down' | 'stable'
  trendValue: number
}

export interface WorkloadSummary {
  totalWorkItems: number
  byType: Record<WorkItemType, number>
  byStatus: Record<WorkItemStatus, number>
  byPriority: Record<WorkItemPriority, number>
  overdueCount: number
  averageCompletionRate: number
}

export interface WorkforceDashboardData {
  totalEmployees: number
  activeEmployees: number
  averageUtilization: number
  overloadedCount: number
  idleCount: number
  utilizationTrend: number
  departmentUtilization: { department: string; rate: number; headcount: number }[]
  workItemSummary: WorkloadSummary
  recentActivities: {
    id: string
    employeeName: string
    action: string
    item: string
    time: string
  }[]
}

// Project Management - Commercial vs Delivery
export interface CommercialProject {
  id: string
  clientName: string
  projectName: string
  status: 'won' | 'negotiation' | 'lead' | 'delivery' | 'completed' | 'lost'
  health: 'healthy' | 'at_risk' | 'critical'
  progressPercent: number
  milestoneProgress: number
  startDate: string
  targetEndDate: string
  budget: number
  actualCost: number
  revenue: number
  profitability: number
  pmName: string
  riskLevel: 'low' | 'medium' | 'high'
  lastActivity: string
}

export interface DeliverySprint {
  id: string
  projectId: string
  projectName: string
  sprintName: string
  startDate: string
  endDate: string
  status: 'planning' | 'active' | 'review' | 'completed'
  totalTasks: number
  completedTasks: number
  blockedTasks: number
  progressPercent: number
}
