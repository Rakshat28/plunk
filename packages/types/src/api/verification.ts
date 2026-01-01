/**
 * Email verification types
 */

/**
 * Result of email address verification
 */
export interface EmailVerificationResult {
  email: string;
  valid: boolean;
  isDisposable: boolean;
  isTypo: boolean;
  isPlusAddressed: boolean;
  domainExists: boolean;
  hasMxRecords: boolean;
  suggestedEmail?: string;
  reasons: string[];
}
