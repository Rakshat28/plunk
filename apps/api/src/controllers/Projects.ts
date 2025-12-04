import {Controller, Delete, Get, Middleware, Patch, Post} from '@overnightjs/core';
import type {NextFunction, Request, Response} from 'express';
import {MembershipSchemas} from '@plunk/shared';

import {prisma} from '../database/prisma.js';
import {HttpException} from '../exceptions/index.js';
import type {AuthResponse} from '../middleware/auth.js';
import {requireAuth} from '../middleware/auth.js';
import {CatchAsync} from '../utils/asyncHandler.js';

@Controller('projects')
export class Projects {
  /**
   * Get project setup state for dashboard quick start
   * GET /projects/:id/setup-state
   */
  @Get(':id/setup-state')
  @Middleware([requireAuth])
  @CatchAsync
  private async getSetupState(req: Request, res: Response, _next: NextFunction) {
    const auth = res.locals.auth as AuthResponse;
    const {id} = req.params;

    // Verify user has access to this project
    const membership = await prisma.membership.findFirst({
      where: {
        userId: auth.userId,
        projectId: id,
      },
    });

    if (!membership) {
      throw new HttpException(404, 'Project not found or you do not have access');
    }

    // Get project with relevant data
    const project = await prisma.project.findUnique({
      where: {id},
      select: {
        subscription: true,
        _count: {
          select: {
            contacts: true,
            domains: {
              where: {verified: true},
            },
            workflows: {
              where: {enabled: true},
            },
          },
        },
      },
    });

    if (!project) {
      throw new HttpException(404, 'Project not found');
    }

    // Get last sent campaign
    const lastCampaign = await prisma.campaign.findFirst({
      where: {
        projectId: id,
        status: 'SENT',
        sentAt: {not: null},
      },
      orderBy: {
        sentAt: 'desc',
      },
      select: {
        sentAt: true,
      },
    });

    return res.json({
      success: true,
      data: {
        hasSubscription: !!project.subscription,
        hasVerifiedDomain: project._count.domains > 0,
        contactCount: project._count.contacts,
        lastCampaignSentAt: lastCampaign?.sentAt || null,
        hasEnabledWorkflow: project._count.workflows > 0,
      },
    });
  }

  /**
   * Get all members of a project
   * GET /projects/:id/members
   */
  @Get(':id/members')
  @Middleware([requireAuth])
  @CatchAsync
  private async getMembers(req: Request, res: Response, _next: NextFunction) {
    const auth = res.locals.auth as AuthResponse;
    const {id} = req.params;

    // Verify user has access to this project
    const membership = await prisma.membership.findFirst({
      where: {
        userId: auth.userId,
        projectId: id,
      },
    });

    if (!membership) {
      throw new HttpException(404, 'Project not found or you do not have access');
    }

    // Get all members of the project
    const members = await prisma.membership.findMany({
      where: {
        projectId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      data: members.map(m => ({
        userId: m.user.id,
        email: m.user.email,
        role: m.role,
      })),
    });
  }

  /**
   * Add a member to a project by email
   * POST /projects/:id/members
   * Body: { email: string, role?: 'ADMIN' | 'MEMBER' }
   */
  @Post(':id/members')
  @Middleware([requireAuth])
  @CatchAsync
  private async addMember(req: Request, res: Response, _next: NextFunction) {
    const auth = res.locals.auth as AuthResponse;
    const {id} = req.params;

    // Validate params
    if (!id) {
      throw new HttpException(400, 'Project ID is required');
    }

    // Validate and parse request body
    const parseResult = MembershipSchemas.addMember.safeParse(req.body);
    if (!parseResult.success) {
      throw new HttpException(400, parseResult.error.errors[0]?.message || 'Invalid request body');
    }

    const {email, role} = parseResult.data;

    // Verify current user is ADMIN or OWNER
    const currentMembership = await prisma.membership.findFirst({
      where: {
        userId: auth.userId,
        projectId: id,
        role: {
          in: ['ADMIN', 'OWNER'],
        },
      },
    });

    if (!currentMembership) {
      throw new HttpException(403, 'Only project admins and owners can add members');
    }

    // Find user by email
    const userToAdd = await prisma.user.findUnique({
      where: {email: email.toLowerCase()},
      select: {id: true, email: true},
    });

    if (!userToAdd) {
      throw new HttpException(404, 'User with this email does not have an account');
    }

    // Check if user is already a member
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_projectId: {
          userId: userToAdd.id,
          projectId: id,
        },
      },
    });

    if (existingMembership) {
      throw new HttpException(409, 'User is already a member of this project');
    }

    // Create membership
    const newMembership = await prisma.membership.create({
      data: {
        userId: userToAdd.id,
        projectId: id,
        role,
      },
    });

    return res.json({
      success: true,
      data: {
        userId: userToAdd.id,
        email: userToAdd.email,
        role: newMembership.role,
      },
    });
  }

  /**
   * Update a member's role
   * PATCH /projects/:id/members/:userId
   * Body: { role: 'ADMIN' | 'MEMBER' }
   */
  @Patch(':id/members/:userId')
  @Middleware([requireAuth])
  @CatchAsync
  private async updateMemberRole(req: Request, res: Response, _next: NextFunction) {
    const auth = res.locals.auth as AuthResponse;
    const {id, userId} = req.params;

    // Validate params
    if (!id) {
      throw new HttpException(400, 'Project ID is required');
    }
    if (!userId) {
      throw new HttpException(400, 'User ID is required');
    }

    // Validate and parse request body
    const parseResult = MembershipSchemas.updateRole.safeParse(req.body);
    if (!parseResult.success) {
      throw new HttpException(400, parseResult.error.errors[0]?.message || 'Invalid request body');
    }

    const {role} = parseResult.data;

    // Verify current user is ADMIN or OWNER
    const currentMembership = await prisma.membership.findFirst({
      where: {
        userId: auth.userId,
        projectId: id,
        role: {
          in: ['ADMIN', 'OWNER'],
        },
      },
    });

    if (!currentMembership) {
      throw new HttpException(403, 'Only project admins and owners can update member roles');
    }

    // Get target membership
    const targetMembership = await prisma.membership.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId: id,
        },
      },
    });

    if (!targetMembership) {
      throw new HttpException(404, 'Member not found');
    }

    // Cannot change OWNER role
    if (targetMembership.role === 'OWNER') {
      throw new HttpException(403, 'Cannot change the role of the project owner');
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: {id: userId},
      select: {id: true, email: true},
    });

    if (!user) {
      throw new HttpException(404, 'User not found');
    }

    // Update role
    await prisma.membership.update({
      where: {
        userId_projectId: {
          userId,
          projectId: id,
        },
      },
      data: {role},
    });

    return res.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        role,
      },
    });
  }

  /**
   * Remove a member from a project
   * DELETE /projects/:id/members/:userId
   */
  @Delete(':id/members/:userId')
  @Middleware([requireAuth])
  @CatchAsync
  private async removeMember(req: Request, res: Response, _next: NextFunction) {
    const auth = res.locals.auth as AuthResponse;
    const {id, userId} = req.params;

    // Validate params
    if (!id) {
      throw new HttpException(400, 'Project ID is required');
    }
    if (!userId) {
      throw new HttpException(400, 'User ID is required');
    }

    // Verify current user is ADMIN or OWNER
    const currentMembership = await prisma.membership.findFirst({
      where: {
        userId: auth.userId,
        projectId: id,
        role: {
          in: ['ADMIN', 'OWNER'],
        },
      },
    });

    if (!currentMembership) {
      throw new HttpException(403, 'Only project admins and owners can remove members');
    }

    // Get target membership
    const targetMembership = await prisma.membership.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId: id,
        },
      },
    });

    if (!targetMembership) {
      throw new HttpException(404, 'Member not found');
    }

    // Cannot remove OWNER
    if (targetMembership.role === 'OWNER') {
      throw new HttpException(403, 'Cannot remove the project owner');
    }

    // Cannot remove yourself
    if (userId === auth.userId) {
      throw new HttpException(403, 'You cannot remove yourself from the project');
    }

    // Delete membership
    await prisma.membership.delete({
      where: {
        userId_projectId: {
          userId,
          projectId: id,
        },
      },
    });

    return res.json({
      success: true,
      data: {message: 'Member removed successfully'},
    });
  }
}
