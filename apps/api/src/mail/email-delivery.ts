export const EMAIL_DELIVERY = Symbol('EMAIL_DELIVERY');

export type VerificationEmail = {
  recipient: string;
  firstName: string;
  token: string;
};

export interface EmailDelivery {
  sendVerificationEmail(message: VerificationEmail): Promise<void>;
}
