export const EMAIL_DELIVERY = Symbol('EMAIL_DELIVERY');

export type VerificationEmail = {
  recipient: string;
  firstName: string;
  token: string;
};

export type PasswordResetEmail = {
  recipient: string;
  firstName: string;
  token: string;
};

export type AttendanceReportEmail = {
  recipient: string;
  recipientName: string;
  eventName: string;
  serviceDate: string;
  scopeLabel: string;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  attachment: {
    filename: string;
    content: Buffer;
  };
};

export interface EmailDelivery {
  sendVerificationEmail(message: VerificationEmail): Promise<void>;
  sendPasswordResetEmail(message: PasswordResetEmail): Promise<void>;
  sendAttendanceReportEmail(message: AttendanceReportEmail): Promise<void>;
}
