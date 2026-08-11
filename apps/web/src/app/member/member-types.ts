export type MemberProfile = {
  firstName: string;
  lastName: string;
  otherNames?: string | null;
  email: string;
  phone?: string | null;
  membershipStatus: string;
  profilePhotoUrl?: string | null;
  coverPhotoUrl?: string | null;
  directoryBio?: string | null;
  directoryVisible: boolean;
  directoryPhoneVisible: boolean;
  skills: string[];
};

export type ActiveEvent = {
  id: string;
  name: string;
  locationName: string | null;
  attendanceClosesAt: string;
};

export type UpcomingEvent = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  attendanceOpensAt: string;
  locationName: string | null;
};

export type Attendance = {
  id: string;
  eventId: string;
  eventName: string;
  eventStartsAt: string;
  locationName: string | null;
  status: string;
  method: string;
  checkedInAt: string | null;
  distanceMeters: number | null;
  accuracyMeters: number | null;
  pointsAwarded: number;
};
