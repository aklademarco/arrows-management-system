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

export interface EmailDelivery {
  sendVerificationEmail(message: VerificationEmail): Promise<void>;
  sendPasswordResetEmail(message: PasswordResetEmail): Promise<void>;
}
