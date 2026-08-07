# Arrows Church Management System (ACMS) UI/UX Skill

## Purpose

This skill guides Codex when designing, implementing, reviewing, and improving the frontend experience of the Arrows Church Management System.

ACMS is a modern church operations platform designed for:

- Youth ministry management
- Member engagement
- Digital attendance
- Location-based check-ins
- Department management
- Reporting
- Leaderboards
- Church operations

The goal is to create a product that feels:

- Modern
- Welcoming
- Trustworthy
- Easy to use
- Enjoyable to return to

This is not a generic administration dashboard.

ACMS should feel like a digital community platform.

---

# Core Design Philosophy

Design every screen around:

> "How can we help church leaders and members accomplish their tasks easily?"

Prioritize:

1. User experience
2. Simplicity
3. Clarity
4. Mobile usability
5. Accessibility
6. Visual quality

Avoid creating software that feels like:

- Accounting software
- Government portals
- Old enterprise systems
- Complex ERP applications

---

# Product Personality

ACMS should communicate:

## Community

Users should feel connected.

## Trust

Information such as attendance and reports must feel reliable.

## Growth

The system should encourage participation.

## Excellence

The interface should feel like a professional SaaS product.

---

# Visual Inspiration

Use inspiration from:

## Modern SaaS Products

Reference qualities from:

- Linear
- Vercel Dashboard
- Stripe Dashboard
- Notion
- Figma

Take inspiration from:

- Clean layouts
- Excellent spacing
- Simple navigation
- Strong typography
- Clear hierarchy

---

## Modern Church Websites

Use inspiration from:

- Contemporary church websites
- Ministry event platforms
- Community applications

Characteristics:

- Warm imagery
- Strong headlines
- Emotional connection
- Beautiful typography
- Calm animations

---

## Member Experience Inspiration

The member experience should feel similar to:

- Apple Health
- Fitness applications
- Community applications
- Modern banking applications

Focus on:

- Progress
- Streaks
- Achievements
- Personal growth

---

# Design System

## Colors

Use a warm professional palette.

Primary:

```
Deep Navy
#0F172A
```

Represents:

- Trust
- Leadership
- Stability


Accent:

```
Warm Gold
#D4A017
```

Represents:

- Celebration
- Excellence
- Achievement


Background:

```
Soft Cream
#FAF7F2
```

Supporting:

Success:

```
#16A34A
```

Warning:

```
#F59E0B
```

Error:

```
#DC2626
```

---

# Typography

Preferred fonts:

Primary:

- Inter
- Geist
- Plus Jakarta Sans

Headings:

- Manrope
- Sora

Typography should feel:

- Modern
- Friendly
- Professional

Avoid small unreadable text.

---

# Layout Principles

Every page should have:

1. Clear purpose
2. Main action
3. Supporting information
4. Logical navigation


Example:

```
Dashboard

Welcome back, John 👋

Your Ministry Overview

[Attendance]
[Events]
[Departments]

Recent Activity
```

---

# Mobile First Requirement

ACMS must work perfectly on mobile.

Important because:

- Members check in using phones
- Attendance happens during services
- Leaders may manage activities while moving

All important actions must be easy with one hand.

---

# User Roles

## Super Admin

Responsibilities:

- System configuration
- User management
- Reports
- Church settings

Dashboard:

Show:

- Total members
- Active departments
- Attendance overview
- System activity

---

## Church Admin

Responsibilities:

- Members
- Departments
- Events
- Analytics

Dashboard:

Show:

- Attendance trends
- Upcoming events
- Member growth
- Department activity

---

## Department Leader

Responsibilities:

- Assigned departments only
- Attendance monitoring
- Reports

Important:

Never expose information outside their permission scope.

---

## Attendance Officer

Responsibilities:

- Verify attendance
- Manual attendance
- Exceptions

Prioritize speed.

---

## Member

Responsibilities:

- Login
- Check-in
- Attendance history
- Leaderboards
- Absence requests

Member UI must feel engaging.

---

# Dashboard Design

Avoid:

```
Sidebar
20 menu items
Tables everywhere
Small text
```

Prefer:

```
Dashboard

Good morning, Sarah 👋

Attendance Today

92%

Upcoming Events

Recent Activity

Department Performance
```

---

# Attendance Experience

Attendance is the main workflow.

The check-in process must be fast.

## Before Check-in

Example:

```
Sunday Youth Service

Attendance Open

Location Required

[Allow Location]
```

---

## Location Verification

Success:

```
Location Verified ✓

You are inside the attendance area.

[Check In]
```

Failure:

```
Location unavailable

Please move closer to the venue.

[Retry]
```

---

## Successful Check-in

Show:

```
Check-in Complete ✓

Status:
ON TIME

Recorded:
9:42 AM
```

---

# Attendance Status UI

Statuses:

- Present
- Early
- On Time
- Late
- Absent
- Excused


Never rely only on colors.

Use:

- Icons
- Labels
- Colors


Example:

```
✓ Present

⏰ Late

○ Absent
```

---

# Member Profile Design

Structure:

```
Member Profile

Personal Information

Name
Phone
Email


Church Information

Primary Department
Other Departments
Membership Status


Attendance

Attendance Rate
Recent Attendance
Streaks
```

---

# Department Design

Department page:

```
Youth Choir

Leader

Members

Attendance Performance

Upcoming Events

Reports
```

---

# Leaderboard Design

Leaderboards should motivate.

Never shame users.

Do not show:

- Lowest performers
- Negative rankings
- Public failures


Show:

```
Monthly Ranking

1. John
2. Mary
3. Daniel


Your Position

12
```

---

# Achievement Design

Use motivation carefully.

Examples:

```
🔥 12 Week Attendance Streak

Keep showing up!
```

```
🏆 Department Champion

Youth Choir
92% Attendance
```

---

# Reports Design

Reports should be understandable.

Support:

- Member attendance
- Department attendance
- Event attendance
- Monthly summaries

Use:

- Charts
- Tables
- Filters
- Export actions

---

# Components

Build reusable components.

Recommended structure:

```
features/

attendance/
 ├── CheckInCard
 ├── LocationStatus
 ├── AttendanceHistory


members/
 ├── MemberCard
 ├── MemberTable
 ├── MemberProfile


departments/
 ├── DepartmentCard
 ├── DepartmentMembers


reports/
 ├── ReportTable
 ├── AttendanceChart
```

---

# UI States

Every feature must handle:

## Loading

Use:

- Skeletons
- Progress indicators


## Empty

Example:

```
No events found.

Create your first event.
```


## Error

Example:

```
Unable to load attendance.

Try again.
```


## Success

Example:

```
Attendance saved successfully.
```

---

# Forms

All forms require:

- Labels
- Validation
- Helpful errors
- Loading states
- Success feedback


Avoid technical messages.

Bad:

```
department_id invalid
```

Good:

```
Please select a department.
```

---

# Accessibility

Follow accessibility standards.

Requirements:

- Semantic HTML
- Keyboard support
- Screen reader support
- Proper contrast
- Clear focus states

---

# Animation Rules

Animations should improve usability.

Good:

- Check-in success animation
- Page transitions
- Hover effects
- Achievement celebrations


Avoid:

- Excessive motion
- Long animations
- Decorative animations everywhere

---

# Development Rules

Before implementing a feature:

1. Understand the user role.
2. Understand the workflow.
3. Identify required states.
4. Create reusable components.
5. Implement responsive design.
6. Test permissions.
7. Review usability.

---

# Technology Expectations

Use:

- TypeScript
- React
- Next.js
- Tailwind CSS
- shadcn/ui

Follow existing project patterns.

Do not add libraries without justification.

---

# Final Quality Checklist

Before completing frontend work:

## UX

- Is the purpose obvious?
- Can users complete tasks quickly?
- Are errors understandable?


## Visual

- Does spacing feel consistent?
- Does typography feel premium?
- Does the interface feel welcoming?


## Mobile

- Works on small screens
- Touch-friendly controls
- No unnecessary scrolling


## Product

- Matches church workflows
- Respects permissions
- Protects user privacy


# Final Rule

Build ACMS as a product that church leaders and members enjoy using.

The goal is not only managing attendance.

The goal is helping the church community stay connected, engaged, and organized.