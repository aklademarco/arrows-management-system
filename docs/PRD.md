# Product Requirements Document (PRD)

**Project:** Arrows Church Management System (ACMS)

**Initial Organization:** Arrows Youth Ministry

**1. Vision**  
Build a web-based platform that helps a church youth ministry manage  
workers, departments, attendance, and engagement through location-based check-ins, reporting, and leaderboards.  
The system should eliminate paper attendance sheets while providing leaders with real-time operational visibility.  

**2. Problem Statement**  
Many youth departments record attendance manually, making it difficult  
to: - Track worker consistency - Measure departmental participation -  
Generate reports - Identify inactive members - Encourage punctuality -  
Maintain accurate attendance history  

**3. Goals**  
**Primary Goals**  

- Digital attendance  
- Location-based verification  
- Department management  
- Individual attendance history  
- Department reporting  
- Leaderboards  
- Role-based access control  
**Secondary Goals**  
- Notifications  
- Achievements  
- Duty scheduling  
- Analytics  
- Multi-branch support  

**4. Target Users**  
**Super Admin**  
Responsible for system administration.  

**Permissions**  

- Manage every module  
- Create administrators  
- Configure church settings  
- View reports  
- Export reports  

**Church Admin**  

Responsible for daily church operations.  

**Permissions**  

- Manage members  
- Manage departments  
- Create events  
- Correct attendance  
- View analytics  
  
**Department Leader**  
Responsible for a single department.  

**Permissions**  

- View attendance and reports only for actively assigned departments.
- View members only within actively assigned departments.
- Review absence requests only when the member and event or primary department fall within the leader's active scope.
- Submit attendance exceptions for administrator review.
- Department leaders cannot add or remove members in Version 1.

**Attendance Officer**  
Responsible for attendance verification.  
**Permissions**  

- Manual attendance  
- Verify exceptions

**Member**  
**Permissions**  

- Login  
- Check in  
- View attendance history  
- View leaderboard  
- Submit absence requests  
- Receive dashboard notifications and authorized church messages.

**Pastor / Church Leader**

- Send dashboard and SMS messages to all active church members.
- Create service liturgies and assign preachers.
- View live service timing and projection views.

**Publicity Leader**

- Submit announcement flyers and publicity instructions to the Media department.
- Associate a publicity request with an event and deadline.
- Receive delivery/read-status updates.

**Choir Leader**

- Submit event song lists, song titles, lyrics, keys, and performance notes.
- Notify eligible choir and media members when material changes.

**5. MVP Features**  

**Authentication**  

- Secure login
- Email verification
- Password reset  
- Session management  

**Member Management**  

- Create members  
- Edit members  
- Activate/deactivate accounts  
- Assign departments  
- Upload profile and cover photos through Cloudinary.
**Department Management**  
- Create departments  
- Assign leaders  
- Assign members  
**Event Management**
- Create church services  
- Cancel events without deleting historical records
- Attendance window  
- Geofence radius  
- Required departments  
**Attendance**  
- Browser location permission  
- Geofence verification  
- Early/on-time/late status  
- Manual attendance  
- Attendance history  
- Automatic absent and excused outcomes after an event closes
**Leaderboards**  
- Individual rankings  
- Department rankings  
- Attendance streaks  
**Reports**  
- Attendance by member  
- Attendance by department  
- Attendance by event  
- Monthly summaries  
- CSV export  

**Ministry Collaboration and Notifications**

- Publicity leaders can send event announcement flyers and instructions to the Media department.
- Media members receive an in-app notification and see outstanding publicity items on their dashboard.
- Choir leaders can publish event song lists with titles, lyrics, keys, ordering, and notes.
- Song-list changes notify the eligible choir and media recipients.
- Collaboration items track sender, target department, event, attachments, delivery state, read state, deadlines, and audit history.

**Leadership Messaging**

- Pastors and authorized church-wide leaders can send messages to all active members.
- Department leaders can send messages only to members in departments they actively lead.
- Messages appear in each recipient's dashboard inbox and may also be delivered by SMS.
- SMS delivery is asynchronous and records queued, sent, delivered, and failed states.
- Recipient scope is resolved and stored when the message is sent so later department transfers do not rewrite message history.
- Sensitive messages, recipient lists, delivery attempts, and authorization decisions are audited.

**Service Liturgy and Live Timing**

- Administrators and authorized pastors can create reusable default service-liturgy templates.
- A liturgy contains ordered schedule items with planned start time, duration, owner, notes, and projection visibility.
- Event liturgies may override the default template without changing the template.
- Events can store the preacher's name, profile, topic, and Cloudinary-hosted image.
- A live service clock calculates planned, actual, remaining, overtime, and cumulative schedule variance.
- Authorized operators can start, pause, skip, extend, and complete liturgy items with every timing change audited.
- Media members can open a clean projection-safe timing view suitable for a church screen or confidence monitor.
- The projection view must support full-screen display, large typography, automatic advancement, and real-time synchronization.
  
**6. Functional Requirements**  
**Authentication**  

- Only registered members can log in.  
- Public registration is allowed.  
- Registered users must verify their email address.
- Administrators have to approve member accounts after email verification.
- Password-reset and email-verification links must expire and be single-use.
**Attendance**  
The system shall:  
- Detect active events.  
- Request browser location.  
- Verify geofence.  
- Prevent duplicate attendance.  
- Record timestamps.  
- Calculate attendance status.  

The MVP will not use device locking, browser fingerprinting, or QR-code verification. Attendance is based on the authenticated account, the event attendance window, and server-side geofence validation.

After an event closes, the system will finalize attendance for every eligible member. Members covered by an approved absence request will receive an `EXCUSED` outcome; other eligible members without attendance will receive an `ABSENT` outcome. A genuine check-in or valid manual attendance will never be overwritten by finalization.

Cancelling an event will preserve any attendance already submitted for audit, exclude the event from attendance rates and leaderboards, void its secondary points, and stop attendance finalization.

**Media Storage**

- Profile photos, cover photos, publicity flyers, preacher images, and other approved image assets shall be stored in Cloudinary rather than PostgreSQL.
- Uploads must be authenticated, restricted to approved image formats and file sizes, and organized under church/member or church/event asset folders.
- Only Cloudinary secure URLs and asset identifiers are stored in the database.
- Replacing or removing an asset must invalidate the previous Cloudinary resource where applicable.
- Private ministry documents and message attachments require authorized delivery; a public image URL must never substitute for access control where confidentiality is expected.

**Notifications and Messaging Authorization**

- Pastors with church-wide messaging permission may target all active members.
- A department leader must hold both the `DEPARTMENT_LEADER` role and an active, unrevoked assignment for every targeted department.
- Publicity and choir workflows must validate the sender's active leadership assignment and the recipient department at submission time.
- Members may mark dashboard notifications read but cannot alter the underlying announcement, message, song list, or liturgy.
- SMS content must exclude secrets and unnecessary sensitive personal information.

**Departments**  

The system shall:

- Allow multiple departments per member.
- Store dated primary-department assignments as the single source of truth, independently from membership history.
- Assign department leaders.  
- Enforce leadership start and end dates for department access.
- Preserve dated department-membership history when members leave and rejoin.
- Generate department reports.  

**Leaderboards**
The system shall:  

- Rank individuals and departments using percentage-based scoring rather than raw attendance totals.
- Calculate the official score as 70% attendance rate and 30% punctuality rate.
- Require at least three expected events in a period before assigning a numbered rank.
- Use monthly rankings by default, with weekly, quarterly, and yearly views.
- Treat points as a secondary motivational value rather than the official ranking metric.
- Track current and longest attendance and punctuality streaks separately from the official score.
- Exclude approved absences, cancelled events, and ineligible events from score denominators.
- Avoid negative points and avoid publishing lowest-performer lists.
- Allow administrators to disable public leaderboards.

**7. Non-Functional Requirements**  

- Mobile-first
- Responsive  
- Secure  
- Fast  
- Reliable  
- Scalable  
- Accessible  
- Audit logging  
- HTTPS only

**8. Success Metrics**  

- ≥95% successful check-ins  
- Check-in completes in under 5 seconds under normal conditions  
- Department attendance reports generated in under 10 seconds  
- Zero duplicate attendance records

**9. Risks**  

- GPS inaccuracies  
- Users denying location permission  
- Internet connectivity issues  
- GPS spoofing  
- Device compatibility  

**10. Future Features**  

- Push notifications  
- Mobile applications  
- Duty scheduling  
- Prayer requests  
- Document library  
- Multi-branch support  
- AI attendance insights  
- Volunteer performance analytics

**11. Assumptions**  

- Members have smartphones with modern browsers.  
- Internet is available during services.  
- Church leadership manages member records.  
- Attendance is verified primarily through geolocation.

**12. Open Questions**  

- What geofence radius should be used?  
- Should check-out be required?  
- Will visitors have limited access?  
- Will multiple services overlap?  

**Next Deliverables**  

1. Database ERD  
2. User Flow Diagrams  
3. REST API Specification  
4. Figma Wireframes  
5. NestJS Architecture  
6. Development Roadmap  
