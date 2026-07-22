# Product Requirements Document (PRD)

**Project**  
**Church Management System (Arrows)**  
*Working title. The name can change later.*  
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

- View department attendance  
- View department reports  
- Approve absences  
- Manage department members  

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

**5. MVP Features**  

**Authentication**  

- Secure login
- Password reset  
- Session management  

**Member Management**  

- Create members  
- Edit members  
- Activate/deactivate accounts  
- Assign departments  
**Department Management**  
- Create departments  
- Assign leaders  
- Assign members  
**Event Management**  
- Create church services  
- Attendance window  
- Geofence radius  
- Required departments  
**Attendance**  
- Browser location permission  
- Geofence verification  
- Early/on-time/late status  
- Manual attendance  
- Attendance history  
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
  
**6. Functional Requirements**  
**Authentication**  

- Only registered members can log in.  
- Public registration is allowed.  
- Administrators has to approve  member accounts.  
**Attendance**  
The system shall:  
- Detect active events.  
- Request browser location.  
- Verify geofence.  
- Prevent duplicate attendance.  
- Record timestamps.  
- Calculate attendance status.  
- Lock device to user so that people do not check in for others  

**Departments**  

The system shall:

- Allow multiple departments per member.
- Assign department leaders.  
- Generate department reports.  

**Leaderboards**  
The system shall:  

- Rank individuals.
- Rank departments using percentage-based scoring.  
- Track attendance streaks.  

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
- How are leaderboard points calculated?  
- How are excused absences handled?  
- Will visitors have limited access?  
- Will multiple services overlap?  

**Next Deliverables**  

1. Database ERD  
2. User Flow Diagrams  
3. REST API Specification  
4. Figma Wireframes  
5. NestJS Architecture  
6. Development Roadmap  
