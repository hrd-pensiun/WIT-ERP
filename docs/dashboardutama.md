# MAIN DASHBOARD

---

## OVERVIEW

Dashboard utama yang menampilkan **summary dari semua module** dalam satu view. Menampilkan hanya data umum dan non-confidential. Semua role melihat tampilan yang sama (tidak ada permission restriction di dashboard ini).

---

## SECTION 1: QUICK STATS (4 CARDS)

### Purpose
Overview cepat status keseluruhan sistem.

### 1.1 Total Users
```
┌─────────────────────┐
│ Total Users         │
│                     │
│       127           │
│                     │
│ Active this month   │
└─────────────────────┘
```
- **Value**: 127 (count of active employees)
- **Subtitle**: "Active this month"
- **Color**: Neutral/Gray

### 1.2 Total Projects
```
┌─────────────────────┐
│ Total Projects      │
│                     │
│       24            │
│                     │
│ In progress         │
└─────────────────────┘
```
- **Value**: 24 (count projects with status IN_PROGRESS)
- **Subtitle**: "In progress"
- **Color**: Blue/Info

### 1.3 Open Tasks
```
┌─────────────────────┐
│ Open Tasks          │
│                     │
│       43            │
│                     │
│ Pending action      │
└─────────────────────┘
```
- **Value**: 43 (count tasks with status NOT COMPLETED)
- **Subtitle**: "Pending action"
- **Color**: Yellow/Warning

### 1.4 System Health
```
┌─────────────────────┐
│ System              │
│                     │
│ [Operational]       │
│                     │
│ All systems OK      │
└─────────────────────┘
```
- **Status Badge**: "Operational" (green) / "Maintenance" (yellow) / "Down" (red)
- **Subtitle**: "All systems OK"
- **Color**: Green (when operational)

---

## SECTION 2: MODULE SUMMARY CARDS (6 CARDS IN GRID)

### Purpose
Quick overview dari setiap module tanpa menampilkan data confidential.

### Layout
```
Row 1: Master Data | HR Management | CRM
Row 2: Projects    | Finance        | Performance
```

### 2.1 Master Data Card
```
┌────────────────────────┐
│ 📊 Master Data         │
├────────────────────────┤
│ Employees       127    │
│ Departments     8      │
│ Last updated    Today  │
│ [View Details Button]  │
└────────────────────────┘
```

**Data Displayed (Non-Confidential):**
- Total Employees count
- Total Departments count
- Last update timestamp
- Button: "View Details" → Link to Master Data module

**Hide:**
- Employee names
- Salary info
- Personal details
- Contact info

### 2.2 HR Management Card
```
┌────────────────────────┐
│ 👥 HR Management       │
├────────────────────────┤
│ Attendance      98%    │
│ Leave Requests  5      │
│ Performance     Active │
│ [View Details Button]  │
└────────────────────────┘
```

**Data Displayed:**
- Attendance percentage (overall)
- Count of pending leave requests
- Performance review status (Active/Inactive)
- Button: "View Details" → Link to HR module

### 2.3 CRM Card
```
┌────────────────────────┐
│ 🎯 CRM                 │
├────────────────────────┤
│ Contacts        234    │
│ Deals           18     │
│ Activities      67     │
│ [Details Button]       │
└────────────────────────┘
```

**Data Displayed:**
- Total Contacts count
- Total Deals count
- Total Activities count
- Button: "Details" → Link to CRM module

**Hide:**
- Contact details
- Deal values
- Private notes

### 2.4 Projects Card
```
┌────────────────────────┐
│ 📋 Projects            │
├────────────────────────┤
│ In Progress     12     │
│ Completed       18     │
│ On Track        95%    │
│ [View Details Button]  │
└────────────────────────┘
```

**Data Displayed:**
- Count of In Progress projects
- Count of Completed projects
- % of projects on track
- Button: "View Details" → Link to Projects module

**Hide:**
- Project budgets
- Specific client names (if confidential)
- Internal strategies

### 2.5 Finance Card
```
┌────────────────────────┐
│ 💰 Finance             │
├────────────────────────┤
│ This Month      IDR 2.5B
│ Invoices Due    8      │
│ Budget Status   78%    │
│ [View Details Button]  │
└────────────────────────┘
```

**Data Displayed:**
- Monthly revenue/transaction summary (rounded)
- Count of invoices due
- Budget utilization percentage
- Button: "View Details" → Link to Finance module

**Hide:**
- Detailed invoice amounts
- Client financial info
- Sensitive cost breakdowns

### 2.6 Performance Card
```
┌────────────────────────┐
│ ⭐ Performance         │
├────────────────────────┤
│ Avg Score       3.5/5.0│
│ Assessment      Active │
│ Completion      71%    │
│ [Details Button]       │
└────────────────────────┘
```

**Data Displayed:**
- Average overall score (from completed assessments)
- Assessment cycle status (Active/Inactive)
- Completion percentage
- Button: "Details" → Link to Performance Assessment module

---

## SECTION 3: RECENT ACTIVITIES (TIMELINE)

### Purpose
Show recent activities across all modules (last 4-5 items).

### Layout
```
┌──────────────────────────────────────────────┐
│ 🔵 New Project Created: Website Redesign    │
│    2 hours ago • Projects                    │
│                                              │
│ 🟢 Performance Review Cycle Started Q2 2024 │
│    Today • Performance                       │
│                                              │
│ 🟡 Invoice Payment Due: Invoice #INV-001    │
│    3 days left • Finance                     │
│                                              │
│ 🔵 New Employee Added: John Doe             │
│    Yesterday • HR                            │
│                                              │
│ → View all activities                        │
└──────────────────────────────────────────────┘
```

**Components:**
- **Activity Icon** (colored dot): Indicates module type
  - Blue (🔵) = General/Projects/CRM
  - Green (🟢) = Performance/Success
  - Yellow (🟡) = Finance/Warning
  - Purple = HR

- **Activity Title**: Brief description (no sensitive data)
- **Timestamp**: "X hours ago", "Today", "Yesterday", "X days ago"
- **Module Tag**: Which module (Projects, Performance, Finance, HR)
- **View All Link**: Navigate to Activity Log page

---

## SECTION 4: QUICK ACTIONS (4 BUTTONS)

### Purpose
Shortcut buttons untuk common tasks (create new items).

### Buttons

**+ New Employee (Master Data)**
- Icon: 👤
- Action: Open form to create new employee
- Redirect: Master Data → Employees → Create

**+ New Project (Projects)**
- Icon: 📋
- Action: Open form to create new project
- Redirect: Projects → Create

**+ New Contact (CRM)**
- Icon: 🎯
- Action: Open form to create new contact
- Redirect: CRM → Contacts → Create

**+ New Invoice (Finance)**
- Icon: 💰
- Action: Open form to create new invoice
- Redirect: Finance → Invoices → Create

---

## DATA REQUIREMENTS

### Database Queries

```sql
-- 1. Total Users
SELECT COUNT(*) as total_users 
FROM employees 
WHERE status = 'ACTIVE';

-- 2. Total Projects
SELECT COUNT(*) as total_projects 
FROM projects 
WHERE status = 'IN_PROGRESS';

-- 3. Open Tasks
SELECT COUNT(*) as open_tasks 
FROM tasks 
WHERE status != 'COMPLETED';

-- 4. System Health
SELECT status FROM system_health 
ORDER BY last_checked DESC LIMIT 1;

-- 5. Master Data Stats
SELECT 
  COUNT(DISTINCT e.employee_id) as total_employees,
  COUNT(DISTINCT d.department_id) as total_departments,
  MAX(e.updated_at) as last_updated
FROM employees e
LEFT JOIN departments d ON e.department_id = d.department_id;

-- 6. HR Stats
SELECT 
  ROUND(AVG(attendance_rate), 2) as avg_attendance,
  COUNT(*) as pending_leave_requests,
  'Active' as performance_status
FROM (
  SELECT 
    employee_id,
    ROUND((days_present / total_work_days * 100), 2) as attendance_rate
  FROM attendance_summary
) att
LEFT JOIN leave_requests lr ON att.employee_id = lr.employee_id 
  AND lr.status = 'PENDING';

-- 7. CRM Stats
SELECT 
  COUNT(DISTINCT contact_id) as total_contacts,
  COUNT(DISTINCT deal_id) as total_deals,
  COUNT(*) as total_activities
FROM crm_contacts
LEFT JOIN crm_deals ON ...
LEFT JOIN crm_activities ON ...;

-- 8. Projects Stats
SELECT 
  COUNT(CASE WHEN status='IN_PROGRESS' THEN 1 END) as in_progress,
  COUNT(CASE WHEN status='COMPLETED' THEN 1 END) as completed,
  ROUND(
    COUNT(CASE WHEN is_on_track=TRUE THEN 1 END) / 
    COUNT(*) * 100, 2
  ) as on_track_percent
FROM projects;

-- 9. Finance Stats
SELECT 
  SUM(amount) as monthly_revenue,
  COUNT(CASE WHEN due_date <= TODAY() AND status != 'PAID' THEN 1 END) as invoices_due,
  ROUND(spent_budget / total_budget * 100, 2) as budget_utilization
FROM invoices
LEFT JOIN budget_summary ON ...;

-- 10. Performance Stats
SELECT 
  ROUND(AVG(overall_score), 2) as avg_score,
  'Active' as status,
  ROUND(
    COUNT(CASE WHEN form_status='COMPLETED' THEN 1 END) / 
    COUNT(*) * 100, 2
  ) as completion_percent
FROM assessment_raters
WHERE assessment_cycle_id = @current_cycle;

-- 11. Recent Activities
SELECT 
  activity_id,
  activity_title,
  activity_type,
  module_name,
  created_at,
  actor_name
FROM activity_log
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY created_at DESC
LIMIT 5;
```

---

## LAYOUT & RESPONSIVE

### Desktop (>1200px)
- Quick Stats: 4 cards in 1 row
- Module Cards: 6 cards in 2 rows (3 per row)
- Activities: Full width
- Quick Actions: 4 buttons in 1 row

### Tablet (768px-1200px)
- Quick Stats: 2 cards per row
- Module Cards: 2 cards per row
- Activities: Full width
- Quick Actions: 2 buttons per row

### Mobile (<768px)
- Quick Stats: 1 card per row (stacked)
- Module Cards: 1 card per row (stacked)
- Activities: Scrollable, simplified
- Quick Actions: 1 button per row (stacked)

---

## REFRESH & CACHING

- **Quick Stats**: Refresh every 5 minutes (or on demand)
- **Module Cards**: Refresh every 10 minutes
- **Activities**: Real-time or refresh every 2 minutes
- **Button**: Manual refresh button (top-right)

---

## PERMISSIONS & VISIBILITY

**Semua role melihat data yang sama (Summary Only)**
- No permission filtering pada dashboard
- Data yang ditampilkan adalah summary/aggregate saja
- Detailed data hanya accessible jika user punya permission ke module tersebut
- Clicking "View Details" akan check permission → show or redirect

---

## COLOR CODING

```
Success/Positive      = Green (#10B981)
In Progress/Neutral   = Blue (#3B82F6)
Warning/Attention     = Yellow (#F59E0B)
Critical/Error        = Red (#EF4444)
Default/Background    = Gray (#6B7280)
```