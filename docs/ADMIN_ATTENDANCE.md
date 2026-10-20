# Admin attendance

Open **Admin dashboard → Mark attendance**, or use the **Attendance** tab.

1. Search for the event and choose **Manage attendance**. Past events are included.
2. Search for the member by name or email.
3. Choose Early, On time, or Late based on their actual arrival, and enter a reason.
4. Select **Save attendance** and check for the success message.

A missing record uses `POST /api/v1/attendance/manual`. An existing record uses
`PATCH /api/v1/attendance/:attendanceId`, including corrections from absent or
excused to present. Both operations use the authenticated admin session and the
API's church-scoped authorization and audit logging. No browser location is needed.

Cancelled events are read-only. Completed events allow corrections to existing
records; the API does not allow creating a new manual record for a completed
event. The roster contains members eligible for that event.

The present count includes only Early, On time, and Late. Saving refreshes the
roster, dashboard, and reports. API failures appear beside the relevant form.

## Verification

Automated action tests cover manual creation, correction of an existing record,
input validation, and duplicate conflicts. Before release, verify with an admin
account on desktop and mobile: select a scheduled event, save attendance for an
eligible member, reload to confirm persistence, then correct an absent record on
a completed event. Confirm the audit log records the administrator and reason.
