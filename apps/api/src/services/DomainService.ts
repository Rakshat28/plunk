import {prisma} from '../database/prisma.js';
import {wrapRedis} from '../database/redis.js';
import {HttpException} from '../exceptions/index.js';
import {Keys} from './keys.js';
import {NtfyService} from './NtfyService.js';
import {getDomainVerificationAttributes, verifyDomain} from './SESService.js';

export class DomainService {
  /**
   * Get a domain by ID
   */
  public static async id(id: string) {
    return wrapRedis(Keys.Domain.id(id), async () => {
      return prisma.domain.findUnique({where: {id}});
    });
  }

  /**
   * Get all domains for a project
   */
  public static async getProjectDomains(projectId: string) {
    return wrapRedis(Keys.Domain.project(projectId), async () => {
      return prisma.domain.findMany({
        where: {projectId},
        orderBy: {createdAt: 'desc'},
      });
    });
  }

  /**
   * Add a new domain to a project and start verification
   */
  public static async addDomain(projectId: string, domain: string) {
    // Start verification process with AWS SES
    const dkimTokens = await verifyDomain(domain);

    // Create domain record
    const newDomain = await prisma.domain.create({
      data: {
        projectId,
        domain,
        verified: false,
        dkimTokens,
      },
      include: {
        project: {
          select: {name: true},
        },
      },
    });

    // Send notification about domain added
    await NtfyService.notifyDomainAdded(domain, newDomain.project.name, projectId);

    return newDomain;
  }

  /**
   * Check verification status for a domain
   */
  public static async checkVerification(domainId: string) {
    const domain = await prisma.domain.findUnique({where: {id: domainId}});

    if (!domain) {
      throw new Error('Domain not found');
    }

    const attributes = await getDomainVerificationAttributes(domain.domain);

    // Update domain if verification status changed
    if (attributes.status === 'Success' && !domain.verified) {
      const updatedDomain = await prisma.domain.update({
        where: {id: domainId},
        data: {verified: true},
        include: {
          project: {
            select: {name: true, id: true},
          },
        },
      });

      // Send notification about domain verified
      await NtfyService.notifyDomainVerified(domain.domain, updatedDomain.project.name, updatedDomain.project.id);
    } else if (attributes.status !== 'Success' && domain.verified) {
      const updatedDomain = await prisma.domain.update({
        where: {id: domainId},
        data: {verified: false},
        include: {
          project: {
            select: {name: true, id: true},
          },
        },
      });

      // Send notification about domain verification failed
      await NtfyService.notifyDomainVerificationFailed(domain.domain, updatedDomain.project.name, updatedDomain.project.id);
    }

    return {
      domain: domain.domain,
      tokens: attributes.tokens,
      status: attributes.status,
      verified: attributes.status === 'Success',
    };
  }

  /**
   * Remove a domain from a project
   */
  public static async removeDomain(domainId: string) {
    const domain = await prisma.domain.findUnique({
      where: {id: domainId},
      include: {
        project: {
          select: {name: true, id: true},
        },
      },
    });

    if (!domain) {
      throw new Error('Domain not found');
    }

    // Extract domain name for checking usage
    const domainName = domain.domain;

    // Check if domain is used in any templates
    const templatesUsingDomain = await prisma.template.count({
      where: {
        projectId: domain.projectId,
        from: {
          contains: `@${domainName}`,
        },
      },
    });

    if (templatesUsingDomain > 0) {
      throw new HttpException(
        409,
        `Cannot delete domain: it is currently used in ${templatesUsingDomain} template(s). Update the templates first.`,
      );
    }

    // Check if domain is used in any workflow steps (via templates)
    const workflowStepsUsingDomain = await prisma.workflowStep.count({
      where: {
        workflow: {
          projectId: domain.projectId,
        },
        template: {
          from: {
            contains: `@${domainName}`,
          },
        },
      },
    });

    if (workflowStepsUsingDomain > 0) {
      throw new HttpException(
        409,
        `Cannot delete domain: it is currently used in ${workflowStepsUsingDomain} workflow step(s). Update the workflow templates first.`,
      );
    }

    // Check if domain is used in any active campaigns
    const campaignsUsingDomain = await prisma.campaign.count({
      where: {
        projectId: domain.projectId,
        from: {
          contains: `@${domainName}`,
        },
        status: {
          in: ['DRAFT', 'SCHEDULED', 'SENDING'],
        },
      },
    });

    if (campaignsUsingDomain > 0) {
      throw new HttpException(
        409,
        `Cannot delete domain: it is currently used in ${campaignsUsingDomain} active campaign(s). Update or complete the campaigns first.`,
      );
    }

    await prisma.domain.delete({where: {id: domainId}});

    // Send notification about domain removal
    await NtfyService.notifyDomainRemoved(domainName, domain.project.name, domain.project.id);

    return true;
  }

  /**
   * Get verified domains for a project
   */
  public static async getVerifiedDomains(projectId: string) {
    return prisma.domain.findMany({
      where: {
        projectId,
        verified: true,
      },
    });
  }

  /**
   * Verify that an email domain belongs to the specified project and is verified
   * @param email Full email address (e.g., "hello@example.com")
   * @param projectId Project ID to verify ownership
   * @returns The verified domain object
   * @throws HttpException if domain not found, not owned by project, or not verified
   */
  public static async verifyEmailDomain(email: string, projectId: string) {
    // Extract domain from email
    const emailParts = email.split('@');
    if (emailParts.length !== 2) {
      throw new HttpException(400, 'Invalid email format');
    }

    const domainName = emailParts[1];

    // Find domain in database
    const domain = await prisma.domain.findFirst({
      where: {
        domain: domainName,
      },
    });

    if (!domain) {
      throw new HttpException(
        403,
        `Domain "${domainName}" is not registered. Please add and verify this domain in your project settings.`,
      );
    }

    // Verify domain belongs to the project
    if (domain.projectId !== projectId) {
      throw new HttpException(
        403,
        `Domain "${domainName}" belongs to a different project. You cannot use this domain.`,
      );
    }

    // Verify domain is verified
    if (!domain.verified) {
      throw new HttpException(
        403,
        `Domain "${domainName}" is not verified. Please complete the DNS verification process in your domain settings.`,
      );
    }

    return domain;
  }

  /**
   * Check if a domain is already linked to another project
   * Used when adding a new domain to verify if the user has access to the existing project
   * @param domain Domain name to check
   * @param userId User ID to check membership
   * @returns Object with exists flag and membership info
   */
  public static async checkDomainOwnership(domain: string, userId: string) {
    const existingDomain = await prisma.domain.findFirst({
      where: {domain},
      include: {
        project: {
          include: {
            members: {
              where: {userId},
            },
          },
        },
      },
    });

    if (!existingDomain) {
      return {exists: false};
    }

    // Check if user is a member of the project that owns this domain
    const isMember = existingDomain.project.members.length > 0;

    return {
      exists: true,
      projectId: existingDomain.project.id,
      projectName: existingDomain.project.name,
      isMember,
    };
  }
}
