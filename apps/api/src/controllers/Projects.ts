import {Controller, Get, Middleware} from '@overnightjs/core';
import type {NextFunction, Request, Response} from 'express';

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
  private async getSetupState(req: Request, res: Response, next: NextFunction) {
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
  private async getMembers(req: Request, res: Response, next: NextFunction) {
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
}
