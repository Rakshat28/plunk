import {promises as dns} from 'dns';
import {run} from '@zootools/email-spell-checker';
import disposable from 'disposable-email';

export interface EmailVerificationResult {
  email: string;
  valid: boolean;
  isDisposable: boolean;
  isTypo: boolean;
  domainExists: boolean;
  hasMxRecords: boolean;
  suggestedEmail?: string;
  reasons: string[];
}

export class EmailVerificationService {
  /**
   * Verify an email address
   * - Checks if domain exists (DNS A/AAAA records)
   * - Checks for MX records
   * - Detects disposable email addresses
   * - Suggests corrections for common typos
   */
  static async verifyEmail(email: string): Promise<EmailVerificationResult> {
    const result: EmailVerificationResult = {
      email,
      valid: true,
      isDisposable: false,
      isTypo: false,
      domainExists: false,
      hasMxRecords: false,
      reasons: [],
    };

    // Extract domain from email
    const emailParts = email.split('@');
    if (emailParts.length !== 2) {
      result.valid = false;
      result.reasons.push('Invalid email format');
      return result;
    }

    const domain = emailParts[1]!; // Safe to assert, we already validated length

    // Check if email is from a disposable domain
    // MailChecker.isValid returns false for disposable emails
    result.isDisposable = disposable.validate(domain);

    // Check for common typos and suggest corrections
    const typoCheck = run({email});
    if (typoCheck && typoCheck.address && typoCheck.address !== email) {
      result.suggestedEmail = typoCheck.full;
      result.reasons.push(`Possible typo detected, did you mean ${typoCheck.domain}?`);
      result.isTypo = true;
    }

    // Check if domain exists (has any DNS records)
    try {
      await dns.resolve(domain, 'A');
      result.domainExists = true;
    } catch {
      // Try AAAA records if A records fail
      try {
        await dns.resolve(domain, 'AAAA');
        result.domainExists = true;
      } catch {
        result.domainExists = false;
        result.valid = false;
        result.reasons.push('Domain does not exist');
      }
    }

    // Check MX records (only if domain exists)
    if (result.domainExists) {
      try {
        const mxRecords = await dns.resolveMx(domain);
        result.hasMxRecords = mxRecords && mxRecords.length > 0;
        if (!result.hasMxRecords) {
          result.valid = false;
          result.reasons.push('No MX records found for domain');
        }
      } catch {
        result.hasMxRecords = false;
        result.valid = false;
        result.reasons.push('No MX records found for domain');
      }
    }

    // If no issues were found, add a success reason
    if (result.valid && result.reasons.length === 0) {
      result.reasons.push('Email appears to be valid');
    }

    return result;
  }
}
