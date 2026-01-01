import {promises as dns} from 'dns';
import {run} from '@zootools/email-spell-checker';
import type {EmailVerificationResult} from '@plunk/types';
import {redis} from '../database/redis.js';

const DISPOSABLE_DOMAINS_URL =
  'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main/disposable_email_blocklist.conf';
const DISPOSABLE_DOMAINS_CACHE_KEY = 'email:disposable_domains';
const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours (list updates daily)

export class EmailVerificationService {
  private static disposableDomainsSet: Set<string> | null = null;

  /**
   * Fetch and cache the disposable domains list from GitHub
   * Uses Redis for caching with 24-hour TTL
   * Falls back to in-memory cache if Redis fails
   */
  private static async getDisposableDomains(): Promise<Set<string>> {
    // Return in-memory cache if available
    if (this.disposableDomainsSet) {
      return this.disposableDomainsSet;
    }

    try {
      // Try to get from Redis cache first
      const cached = await redis.get(DISPOSABLE_DOMAINS_CACHE_KEY);
      if (cached) {
        const domains = JSON.parse(cached) as string[];
        this.disposableDomainsSet = new Set(domains);
        return this.disposableDomainsSet;
      }

      // Fetch from GitHub if not in cache
      const response = await fetch(DISPOSABLE_DOMAINS_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch disposable domains: ${response.statusText}`);
      }

      const text = await response.text();
      const domains = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#')); // Filter empty lines and comments

      // Cache in Redis
      await redis.set(DISPOSABLE_DOMAINS_CACHE_KEY, JSON.stringify(domains), 'EX', CACHE_TTL_SECONDS);

      // Cache in memory
      this.disposableDomainsSet = new Set(domains);
      return this.disposableDomainsSet;
    } catch (error) {
      console.error('Error fetching disposable domains:', error);
      // Return empty set as fallback - don't block email verification
      return new Set<string>();
    }
  }

  /**
   * Check if a domain is disposable
   */
  private static async isDisposableDomain(domain: string): Promise<boolean> {
    const disposableDomains = await this.getDisposableDomains();
    return disposableDomains.has(domain.toLowerCase());
  }

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
      isPlusAddressed: false,
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

    // Check if email is from a disposable domain using GitHub list
    result.isDisposable = await this.isDisposableDomain(domain);

    // Check for plus addressing
    result.isPlusAddressed = emailParts[0]!.includes('+');

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
