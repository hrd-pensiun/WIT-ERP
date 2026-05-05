# 360 ASSESSMENT DASHBOARD - 3 TAB PANDUAN

## OVERVIEW
Dashboard personal untuk employee tracking penilaian 360 mereka dengan 3 tab utama:
1. **Form List** - Daftar form yang harus diisi employee
2. **Latest Results** - Hasil penilaian dari cycle sebelumnya
3. **My Insights** - Analitik dan rekomendasi pengembangan

---

## TAB 1: FORM LIST

### Purpose
Menampilkan semua form penilaian yang harus **employee isi** atau **rater isi untuk employee ini**

### Components

#### 1.1 Filter Section
```
[Filter: Status: All ▼] [Filter: Rater Type: All ▼] [Filter: Period: 2024 Q2 ▼]
```
- Status: All, Pending, In Progress, Completed
- Rater Type: All, Self, Superior, Peer, Subordinate
- Period: Dropdown cycle

#### 1.2 Summary Cards
Dua card side-by-side:

**Left Card - Progress**
```
Progress
2 of 4 completed (50%)

[████░░░░░░] 50%
```

**Right Card - Deadline**
```
Soonest Deadline
3 hari

Status: 1 Overdue, 2 Pending
```

#### 1.3 Form List Table

| Form Penilaian | Rater | Status | Deadline |
|---|---|---|---|
| **Self Assessment** | Igor Tolic Kadiv (Diri Sendiri) | ✅ Completed | — |
| **Superior Assessment** | Royadi Nainggolan (Atasan) | 🟡 Pending | 5 hari |
| **Peer Assessment** | Antonius Gunadharma (Peer) | 🟡 In Progress | 3 hari |
| **Subordinate Assessment** | Fadhilah Abdul Aziz (Bawahan) | 🔴 Not Started | OVERDUE |

**Column Explanation:**
- **Form Penilaian** - Tipe form (Self, Superior, Peer, Subordinate)
- **Rater** - Siapa yang isi form + role mereka
- **Status** - Completed/In Progress/Pending/Not Started (dengan badge warna)
- **Deadline** - Sisa hari atau OVERDUE

**Status Badge Colors:**
- ✅ Completed = Green
- 🟡 Pending/In Progress = Yellow
- 🔴 Not Started/Overdue = Red

#### 1.4 Actions
- Click form row → Buka form untuk diisi atau lihat detail
- Filter dropdown → Update table berdasarkan filter
- Sort by deadline → Prioritas yang urgent

---

## TAB 2: LATEST RESULTS

### Purpose
Menampilkan hasil penilaian dari **cycle sebelumnya** (retrospektif)

### Components

#### 2.1 Header Info
```
Q2 2024 Review
Periode: 1 Mei - 31 Mei 2024
Status: Complete
Completed: 6/6 raters
```

#### 2.2 Overall Score Card
```
Overall Score
4.2 / 5.0

dari 6 raters

[████████░░] 84% (visual progress bar)
```

#### 2.3 Per Competency Breakdown

Table format:

| Kompetensi | Score | Visual |
|---|---|---|
| Technical Competence | 4.5 | ████████░ |
| Leadership & Delegation | 4.0 | ████░░░░░ |
| Communication | 3.8 | ███░░░░░░ |
| Teamwork | 4.2 | ████░░░░░ |
| Accountability | 4.3 | ████░░░░░ |
| Continuous Learning | 4.1 | ████░░░░░ |

**Details:**
- Urut dari highest ke lowest score
- Include visual bar chart (■) untuk easy scanning
- Hover tooltip untuk lihat detail dari masing-masing rater

#### 2.4 Key Feedback Themes (Sentiment Analysis)

```
Key Feedback Themes
✓ Strong technical skills
✓ Good team player
✓ Takes ownership

⚠️ Could improve delegation
⚠️ Listen more to team input
⚠️ Communication bisa lebih clear
```

**Derivation:**
- Extract dari comment/notes dari semua rater
- Auto-group berdasarkan keyword/sentiment
- Show positive (✓) dan improvement area (⚠️)

#### 2.5 Rater Distribution
```
Feedback dari:
- Self: 1 rater
- Superior (Royadi): 1 rater
- Peer (Antonius, Gabriel): 2 raters
- Subordinate (Fadhilah, Gabriel): 2 raters
```

---

## TAB 3: MY INSIGHTS

### Purpose
Memberikan **insight personal** berdasarkan historical data + trend analysis

### Components

#### 3.1 Score Trend (3+ Cycles)

```
📈 Score Trend Over Time

Q4 2023: 3.8
Q1 2024: 4.0 (↑ +0.2)
Q2 2024: 4.2 (↑ +0.2)

Overall: Consistently improving! ✓
```

**Chart Option:**
- Line chart showing score progression
- Include commentary: "naik", "stable", "turun"

#### 3.2 Strength vs Development Areas

**Left Column - Top Strengths**
```
💪 Top Strengths (Highest Scores)

1. Technical Competence (4.5)
   - Konsisten dari semua rater
   - Keep maintaining & sharing knowledge

2. Accountability (4.3)
   - Taking responsibility with ease
   - Leverage untuk lead projects

3. Teamwork (4.2)
   - Good collaboration skills
   - Focus on: mentoring junior
```

**Right Column - Development Areas**
```
🎯 Development Areas (Lowest Scores)

1. Leadership & Delegation (4.0)
   - Gap: 0.5 dari top strength
   - Action: Leadership training atau coaching
   - Timeline: 3-6 bulan

2. Communication (3.8)
   - Gap: 0.7 dari top strength
   - Action: Presentation skills course
   - Timeline: Next quarter

3. Continuous Learning (3.9)
   - Gap: 0.6
   - Action: Enroll di learning program
```

#### 3.3 Self vs Others Perception

```
👥 Self vs Rater Perception

Avg Score by Rater Type:
- Self Assessment: 4.3 ⬆️ (You rated yourself higher)
- Superior (Royadi): 4.4 (Most positive)
- Peer: 4.1 (Balanced view)
- Subordinate: 4.0 (Slightly lower)

Insight: Self-perception sedikit lebih tinggi dari peers
→ Opportunity: Be more modest, listen to feedback openly
→ Good: Atasan positif dengan Anda
```

**Visual:**
- Bar chart comparing rater types
- Annotation untuk insights

#### 3.4 Competency Comparison

```
🔄 How You Compare to Org Average

Your Score | Org Avg | Gap
4.2 | 3.9 | +0.3 (Above Average)

Technical: 4.5 | 3.8 | +0.7 (Top 10%)
Leadership: 4.0 | 3.9 | +0.1 (Average)
Communication: 3.8 | 3.9 | -0.1 (Below Avg)
```

#### 3.5 Development Recommendation

```
💡 Recommended Development Plan

Based on your scores & feedback, here's your personalized plan:

Priority 1: Leadership & Delegation (4.0)
├─ Action: Enroll in "Leading Teams" workshop
├─ Timeline: Next 3 months
├─ Mentor: Royadi (your manager)
└─ Success Metric: Score 4.5+ in Q3

Priority 2: Communication Skills (3.8)
├─ Action: Toastmasters atau presentation coaching
├─ Timeline: 6 months
├─ Buddy: Antonius (peer feedback)
└─ Success Metric: Feedback mentions "clear communicator"

Priority 3: Delegation & Mentoring (4.0)
├─ Action: Mentor 1-2 junior devs
├─ Timeline: Ongoing
├─ Accountability: Monthly 1-on-1s
└─ Success Metric: Jr devs show growth

Target for Next Review:
- Q3 2024: Improve Leadership & Communication to 4.5+
- Keep Technical Competence strong (4.5+)
- Maintain Teamwork score (4.2+)
```

#### 3.6 Upcoming Opportunities

```
📅 Recommended Actions

This Quarter:
☐ Schedule 1-on-1 with Royadi to discuss plan
☐ Enroll in leadership training (by end of month)
☐ Find mentor/buddy for accountability

Next Quarter:
☐ Mid-cycle check-in on progress
☐ Adjust plan based on feedback
☐ Q3 assessment cycle begins
```

---

## TECHNICAL NOTES

### Data Requirements

**Tab 1 - Form List:**
- assessment_cycle_id
- assessee_id
- rater_id
- rater_name
- rater_role (Self, Superior, Peer, Subordinate)
- form_status (Pending, In Progress, Completed)
- deadline_date
- submission_date (jika completed)

**Tab 2 - Latest Results:**
- previous_cycle_id
- competency_scores (per kompetensi)
- overall_score
- comments/feedback text (untuk sentiment analysis)
- rater_type_breakdown

**Tab 3 - My Insights:**
- historical scores (3+ cycles)
- org_average_scores
- competency_ranks
- recommended_actions

### Calculation Logic

**Score Calculation:**
```
Overall Score = Average dari semua competency scores
Competency Score = Average dari semua rater scores untuk competency itu
```

**Trend Analysis:**
```
IF current_score > previous_score THEN "↑ Naik"
ELSE IF current_score = previous_score THEN "→ Stable"
ELSE "↓ Turun"
```

**Self vs Others Gap:**
```
Self_Score - Average_Rater_Score = perception_gap
IF gap > 0.3 THEN "Self-perception lebih tinggi (needs recalibration)"
```

### Color Coding
- ✅ Green (#Success) = Completed, Above Average, Strength
- 🟡 Yellow (#Warning) = Pending, In Progress, Average
- 🔴 Red (#Danger) = Not Started, Overdue, Below Average, Improvement Area

---

## USER FLOW

1. **Employee visits dashboard**
   → Default to TAB 1 (Form List)

2. **Employee checks what to do**
   → See pending forms + deadline

3. **After cycle complete**
   → TAB 2 shows results automatically

4. **Employee wants to understand**
   → TAB 3 for trend, strength, & development plan

5. **Employee takes action**
   → Koordinate dengan manager untuk execute plan