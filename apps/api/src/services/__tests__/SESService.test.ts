import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { sendRawEmail } from '../SESService';

// Mock with both paths to catch resolution variations
vi.mock('../../app/constants.js', () => ({
  AWS_SES_ACCESS_KEY_ID: 'test-key-id',
  AWS_SES_REGION: 'us-east-1',
  AWS_SES_SECRET_ACCESS_KEY: 'test-secret',
  DASHBOARD_URI: 'http://localhost:3000',
  SES_CONFIGURATION_SET: 'test-config-set',
  SES_CONFIGURATION_SET_NO_TRACKING: 'test-no-tracking-set',
  TRACKING_TOGGLE_ENABLED: true,
}));



// Mock the SES client
vi.mock('@aws-sdk/client-ses', () => {
  const SESMock = vi.fn();
  SESMock.prototype.sendRawEmail = vi.fn().mockResolvedValue({ MessageId: 'test-message-id' });
  return { SES: SESMock };
});

describe('SESService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should correctly structure MIME boundaries for mixed content (attachments)', async () => {
    // Import the exported instance to verify calls
    const { ses } = await import('../SESService');
    
    const params = {
      from: { name: 'Sender', email: 'sender@example.com' },
      to: ['recipient@example.com'],
      content: { subject: 'Test Subject', html: '<p>Hello world</p>' },
      attachments: [
        {
          filename: 'test.txt',
          content: 'SGVsbG8=', // Hello
          contentType: 'text/plain',
          disposition: 'attachment' as const,
        },
      ],
    };

    await sendRawEmail(params);

    expect(ses.sendRawEmail).toHaveBeenCalled();
    const callArgs = (ses.sendRawEmail as Mock).mock.calls[0][0];
    const rawMessage = new TextDecoder().decode(callArgs.RawMessage.Data);

    // Verify boundary hierarchy: Mixed -> Alternative
    // Explicitly check that "multipart/mixed" is the root content type (first occurrence)
    expect(rawMessage).toMatch(/^From:.*Content-Type: multipart\/mixed; boundary="([^"]+)"/s);
    
    // Check for presence of alternative boundary nested inside
    expect(rawMessage).toMatch(/Content-Type: multipart\/alternative; boundary="([^"]+)"/);
    
    // Verify distinct boundaries
    const mixedBoundaryMatch = rawMessage.match(/boundary="([^"]+)"/);
    const mixedBoundary = mixedBoundaryMatch ? mixedBoundaryMatch[1] : '';
    
    expect(rawMessage).toContain(`--${mixedBoundary}\nContent-Type: multipart/alternative`);
    expect(rawMessage).toContain(`--${mixedBoundary}--`);
  });

  it('should correctly structure MIME boundaries for related content (inline images)', async () => {
    const { ses } = await import('../SESService');
    
    const params = {
      from: { name: 'Sender', email: 'sender@example.com' },
      to: ['recipient@example.com'],
      content: { subject: 'Test Subject', html: '<p>Hello world <img src="cid:image1"></p>' },
      attachments: [
        {
          filename: 'image.png',
          content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
          contentType: 'image/png',
          contentId: 'image1',
          disposition: 'inline' as const,
        },
      ],
    };

    await sendRawEmail(params);

    const callArgs = (ses.sendRawEmail as Mock).mock.calls[0][0];
    const rawMessage = new TextDecoder().decode(callArgs.RawMessage.Data);

    // Verify boundary hierarchy: Related -> Alternative
    expect(rawMessage).toMatch(/^From:.*Content-Type: multipart\/related; boundary="([^"]+)"/s);
    
    const relatedBoundaryMatch = rawMessage.match(/boundary="([^"]+)"/);
    const relatedBoundary = relatedBoundaryMatch ? relatedBoundaryMatch[1] : '';
    
    // Check that related part contains alternative part
    expect(rawMessage).toContain(`--${relatedBoundary}\nContent-Type: multipart/alternative`);
    // And also contains the inline attachment
    expect(rawMessage).toContain(`Content-Disposition: inline; filename="image.png"`);
    expect(rawMessage).toContain(`--${relatedBoundary}--`);
  });

  it('should correctly nest mixed > related > alternative boundaries', async () => {
    const { ses } = await import('../SESService');
    
    const params = {
      from: { name: 'Sender', email: 'sender@example.com' },
      to: ['recipient@example.com'],
      content: { subject: 'Test Subject', html: '<p>Hello world <img src="cid:image1"></p>' },
      attachments: [
        {
          filename: 'test.txt',
          content: 'SGVsbG8=',
          contentType: 'text/plain',
          disposition: 'attachment' as const,
        },
        {
          filename: 'image.png',
          content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
          contentType: 'image/png',
          contentId: 'image1',
          disposition: 'inline' as const,
        },
      ],
    };

    await sendRawEmail(params);

    const callArgs = (ses.sendRawEmail as Mock).mock.calls[0][0];
    const rawMessage = new TextDecoder().decode(callArgs.RawMessage.Data);

    // Root should be mixed
    expect(rawMessage).toMatch(/^From:.*Content-Type: multipart\/mixed; boundary="([^"]+)"/s);

    // Find the mixed boundary
    const mixedMatch = rawMessage.match(/Content-Type: multipart\/mixed; boundary="([^"]+)"/);
    const mixedBoundary = mixedMatch ? mixedMatch[1] : 'NOT_FOUND_MIXED';
    
    // Within mixed, we should find related
    // The code structure:
    // --mixed
    // Content-Type: multipart/related; boundary="related"
    // --related
    // Content-Type: multipart/alternative; boundary="alt"
    
    // Check hierarchy via regex matching structure
    // Check that related is defined inside mixed
    expect(rawMessage).toContain(`--${mixedBoundary}\nContent-Type: multipart/related`);
    
    // Find related boundary
    const relatedMatch = rawMessage.match(/Content-Type: multipart\/related; boundary="([^"]+)"/);
    const relatedBoundary = relatedMatch ? relatedMatch[1] : 'NOT_FOUND_RELATED';
    
    // Check that alternative is defined inside related
    expect(rawMessage).toContain(`--${relatedBoundary}\nContent-Type: multipart/alternative`);
    
    const altMatch = rawMessage.match(/Content-Type: multipart\/alternative; boundary="([^"]+)"/);
    const altBoundary = altMatch ? altMatch[1] : 'NOT_FOUND_ALT';
    
    // Verify closing boundaries existence and order implies nesting
    // The end of string should look like:
    // --related--
    // --mixed
    // ...attachment...
    // --mixed--
    
    expect(rawMessage).toContain(`--${altBoundary}--`);
    expect(rawMessage).toContain(`--${relatedBoundary}--`);
    expect(rawMessage).toContain(`--${mixedBoundary}--`);
  });
});
