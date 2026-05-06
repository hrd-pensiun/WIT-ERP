# ADMIN DASHBOARD 360 ASSESSMENT

---

## OVERVIEW

Dashboard untuk Owner/Superadmin untuk monitor dan manage seluruh proses penilaian 360 dalam satu siklus. Menampilkan infografik real-time, analytics, dan management tools.

---

## SECTION 1: KEY METRICS (4 CARDS)

### Purpose
Menampilkan overview cepat status keseluruhan assessment cycle.

### 1.1 Avg Total Score
```
┌─────────────────────┐
│ AVG Total Score     │
│                     │
│       3.5 / 5.0     │
│                     │
│ dari 9 employee     │
│ (font kecil)        │
└─────────────────────┘
```
- **Value**: 3.5 (average score dari semua employees)
- **Subtitle**: "dari 9 employee" (font smaller, 9pt)
- **Color**: Blue/Info
- **Calculation**: Average dari semua overall scores yang sudah completed

**Formula:**
```
AVG Total Score = (Sum semua overall_score) / (Total employees dengan completed assessment)

Contoh:
Employee 1: 4.2
Employee 2: 3.8
Employee 3: 4.5
...
Employee 9: 3.6

AVG = (4.2 + 3.8 + 4.5 + ... + 3.6) / 9 = 3.5
```

### 1.2 Forms Completed
```
┌─────────────────────┐
│ Forms Completed     │
│                     │
│      24 / 34        │
│  [████████░░] 71%   │
│                     │
│   Progres assessment │
└─────────────────────┘
```
- **Value**: 24 / 34 forms
- **Subtitle**: "71% Complete" (calculated)
- **Progress Bar**: Visual bar showing completion
- **Color**: Green (success)

**Calculation:**
```
Total Forms = (Self + Superior + Peer + Subordinate)
           = (9 + 8 + 11 + 4)
           = 32 forms
           
Completed = Count of forms dengan status "COMPLETED"

Progress % = (Completed / Total) * 100
```

### 1.3 Pending Responses
```
┌─────────────────────┐
│ Pending Responses   │
│                     │
│        8            │
│ Forms in progress   │
│                     │
│   2 OVERDUE ⚠️      │
└─────────────────────┘
```
- **Value**: 8 (forms status = PENDING or IN_PROGRESS)
- **Subtitle**: "Forms in progress"
- **Warning**: "2 OVERDUE" jika ada
- **Color**: Yellow/Warning

**Calculation:**
```
Pending = Count where form_status IN ('PENDING', 'IN_PROGRESS')
Overdue = Count where deadline < TODAY and status != 'COMPLETED'
```

### 1.4 Overdue
```
┌─────────────────────┐
│ Overdue             │
│                     │
│        2            │
│                     │
│ Need follow-up ⚠️   │
└─────────────────────┘
```
- **Value**: 2 (forms yang passed deadline)
- **Subtitle**: "Need follow-up"
- **Color**: Red/Danger

---

## SECTION 2: BY DEPARTMENT (PROGRESS BARS)

### Purpose
Breakdown completion status per department.

### Layout
```
┌─────────────────────────────────────────────────────┐
│ 📍 BY DEPARTMENT                                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Dept Technology                    18 / 18 (100%)  │
│ [████████████████████] ✓            6 employees    │
│                                                      │
│ Dept Operational                   6 / 8 (75%)    │
│ [████████████░░░░░░░░]             3 employees    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Data Requirements
- `department_name`
- `total_forms_by_dept` (calculated based on employees in dept)
- `completed_forms_by_dept` (count where form_status = COMPLETED)
- `total_employees_in_dept`

### Calculation
```
Total Forms per Dept = 
  (Sum of forms untuk semua employees di dept itu)

Completed Forms per Dept = 
  (Count forms dengan status COMPLETED di dept itu)

Progress % = (Completed / Total) * 100
```

---

## SECTION 3: BY JOB LEVEL (CARD GRID)

### Purpose
Breakdown completion status per job level untuk lihat progress di setiap hierarchy level.

### Layout - 4 Cards

#### Level 10 (CEO)
```
┌──────────────┐
│ Level 10     │
│ (CEO)        │
│              │
│     1        │
│ ████████████ │ (progress bar)
│ 1/1 (100%)   │
└──────────────┘
```

#### Level 8 (C-Suite)
```
┌──────────────┐
│ Level 8      │
│ (C-Suite)    │
│              │
│     2        │
│ █████████░░░ │ (progress bar)
│ 1.5/2 (75%)  │
└──────────────┘
```

#### Level 6 (Lead)
```
┌──────────────┐
│ Level 6      │
│ (Lead)       │
│              │
│     2        │
│ █████████░░░ │ (progress bar)
│ 1.5/2 (75%)  │
└──────────────┘
```

#### Level 1 (Junior)
```
┌──────────────┐
│ Level 1      │
│ (Junior)     │
│              │
│     4        │
│ █████████░░░ │ (progress bar)
│ 3/4 (75%)    │
└──────────────┘
```

### Data Requirements
- `job_level`
- `total_employees_by_level`
- `total_forms_by_level`
- `completed_forms_by_level`

### Color Coding
- 100% = Green
- 75%+ = Yellow/Orange
- <75% = Red/Danger

---

## SECTION 4: RESPONSE RATE BY RATER TYPE (4 CARDS)

### Purpose
Show completion rate untuk setiap tipe rater (Self, Superior, Peer, Subordinate).

### Layout

#### Self Assessment
```
┌──────────────────┐
│ Self Assessment  │
│                  │
│    9/9 ✓         │
│    100%          │
└──────────────────┘
```
- Color: Green (semua orang always complete self)

#### Superior Rating
```
┌──────────────────┐
│ Superior Rating  │
│                  │
│    6/8           │
│    75% ⚠️        │
└──────────────────┘
```
- Color: Yellow (ada yang belum submit)

#### Peer Assessment
```
┌──────────────────┐
│ Peer Assessment  │
│                  │
│    5/11          │
│    45% ⚠️        │
└──────────────────┘
```
- Color: Red/Yellow (lowest response rate, perlu follow-up)

#### Subordinate
```
┌──────────────────┐
│ Subordinate      │
│                  │
│    4/4 ✓         │
│    100%          │
└──────────────────┘
```
- Color: Green (complete)

### Data Requirements
```
Self Raters      = Count where rating_type = 'SELF'
Superior Raters  = Count where rating_type = 'SUPERIOR'
Peer Raters      = Count where rating_type = 'PEER'
Subordinate      = Count where rating_type = 'SUBORDINATE'

Completed per Type = Count where rating_type = X AND form_status = 'COMPLETED'

Response Rate % = (Completed / Total) * 100 per type
```

---

## SECTION 5: ASSESSMENT MANAGEMENT (FILTER + TABLE)

### Purpose
Admin dapat manage, track, dan take action untuk setiap assessment.

### 5.1 Filter Section

**Dropdowns:**
```
Filter by: [Department ▼] [Status ▼] [Job Level ▼]
```

**Filter Options:**

**Department:**
- All
- Dept Technology
- Dept Operational

**Status:**
- All
- Completed (100%)
- In Progress (25-99%)
- Not Started (0%)
- Overdue

**Job Level:**
- All
- Level 10 (CEO)
- Level 8 (C-Suite)
- Level 6 (Lead)
- Level 1 (Junior)

### 5.2 Table Header

```
┌────────┬──────────┬───────┬───────┬──────────┬─────────┐
│ Employee│ Dept    │ Level │ Forms │Completed │ Action  │
├────────┼──────────┼───────┼───────┼──────────┼─────────┤
│        │          │       │       │          │         │
└────────┴──────────┴───────┴───────┴──────────┴─────────┘
```

**Column Details:**

| Column | Data | Type | Example |
|--------|------|------|---------|
| Employee | name | text | Jean Pierre |
| Dept | department_name | text | Technology |
| Level | job_level | number | 10 |
| Forms | total_forms_for_this_emp | number | 2 |
| Completed | completed_count / total_count | fraction + % | 2/2 (100%) |
| Action | button | link | View, Follow-up, Remind |

### 5.3 Table Rows (Example Data)

**Row 1: Jean Pierre (100% - Complete)**
```
Jean Pierre | —      | 10 | 2 | ✓ 100% | View
```
- Status badge: Green

**Row 2: Royadi (60% - Pending)**
```
Royadi (CTO) | Technology | 8 | 5 | ⚠️ 60% | Follow-up
```
- Status badge: Yellow
- Action: "Follow-up" button

**Row 3: Igor (100% - Complete)**
```
Igor | Technology | 6 | 6 | ✓ 100% | View
```
- Status badge: Green

**Row 4: Cahya (50% - Not Started)**
```
Cahya | Technology | 1 | 2 | ❌ 50% | Remind
```
- Status badge: Red
- Action: "Remind" button (send reminder email)

### 5.4 Action Buttons

**View**
- Purpose: Open detailed assessment report untuk employee ini
- Link to: Employee profile + assessment results

**Follow-up**
- Purpose: Send custom follow-up message to raters yang belum submit
- Action: Open modal/form untuk compose message

**Remind**
- Purpose: Send automatic reminder email
- Action: Click → send reminder email to overdue raters

### 5.5 Pagination

```
Showing 4 of 9 employees | Page 1        < Prev | Next >
```

---

## SECTION 6: TECHNICAL NOTES

### Real-time Updates
- Metrics auto-refresh setiap 5 menit
- Or refresh on demand (manual refresh button)

### Data Sources
```
SELECT 
  e.employee_id,
  e.name,
  e.job_level,
  e.department,
  COUNT(ar.assessment_id) as total_forms,
  SUM(CASE WHEN ar.form_status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_forms,
  ar.rating_type,
  ar.form_status
FROM employees e
LEFT JOIN assessment_raters ar 
  ON ar.assessee_id = e.employee_id 
  AND ar.assessment_cycle_id = @CYCLE_ID
WHERE e.status = 'ACTIVE'
GROUP BY e.employee_id
```

### Export Options
- Download table as CSV/Excel
- Export metrics as PDF report
- Email summary to stakeholders

---

## COLOR SCHEME

```
Success/Complete    = Green (#10B981)
Warning/In Progress = Yellow (#F59E0B)
Danger/Overdue      = Red (#EF4444)
Neutral/Default     = Gray (#6B7280)
Info/Secondary      = Blue (#3B82F6)
```

---

## RESPONSIVE DESIGN

**Desktop (>1200px):**
- All 4 key metrics in 1 row
- 2 sections per row (Dept + Level)
- Full table with all columns

**Tablet (768px-1200px):**
- 2 key metrics per row
- 1 section per row
- Table scrollable horizontally

**Mobile (<768px):**
- 1 key metric per row
- Section stacked vertically
- Table simplified (show only key columns)