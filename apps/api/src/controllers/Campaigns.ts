import {Controller, Delete, Get, Middleware, Post, Put} from '@overnightjs/core';
import {CampaignAudienceType, CampaignStatus} from '@plunk/db';
import {CampaignSchemas} from '@plunk/shared';
import type {Request, Response} from 'express';

import {HttpException} from '../exceptions/index.js';
import type {AuthResponse} from '../middleware/auth.js';
import {requireAuth} from '../middleware/auth.js';
import {CampaignService} from '../services/CampaignService.js';
import {DomainService} from '../services/DomainService.js';
import {type SegmentFilter} from '../services/SegmentService.js';

@Controller('campaigns')
export class Campaigns {
  /**
   * Create a new campaign
   * POST /campaigns
   */
  @Post('')
  @Middleware([requireAuth])
  private async create(req: Request, res: Response) {
    const auth = res.locals.auth as AuthResponse;
    const {name, description, subject, body, from, fromName, replyTo, audienceType, audienceFilter, segmentId} =
      CampaignSchemas.create.parse(req.body);

    // Validate audience-specific fields
    if (audienceType === CampaignAudienceType.SEGMENT && !segmentId) {
      throw new HttpException(400, 'Segment ID is required for SEGMENT audience type');
    }

    if (audienceType === CampaignAudienceType.FILTERED && !audienceFilter) {
      throw new HttpException(400, 'Audience filter is required for FILTERED audience type');
    }

    // Verify domain ownership and verification
    await DomainService.verifyEmailDomain(from, auth.projectId);

    const campaign = await CampaignService.create(auth.projectId, {
      name,
      description,
      subject,
      body,
      from,
      fromName,
      replyTo,
      audienceType,
      audienceFilter: audienceFilter as SegmentFilter[] | undefined,
      segmentId,
    });

    return res.status(201).json({
      success: true,
      data: campaign,
    });
  }

  /**
   * Get all campaigns for a project
   * GET /campaigns
   */
  @Get('')
  @Middleware([requireAuth])
  private async list(req: Request, res: Response) {
    const auth = res.locals.auth as AuthResponse;
    const status = req.query.status as CampaignStatus | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    // Validate status if provided
    if (status && !Object.values(CampaignStatus).includes(status)) {
      throw new HttpException(400, 'Invalid status value');
    }

    const result = await CampaignService.list(auth.projectId, {
      status,
      page,
      pageSize,
    });

    return res.json({
      campaigns: result.campaigns,
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  }

  /**
   * Get a specific campaign
   * GET /campaigns/:id
   */
  @Get(':id')
  @Middleware([requireAuth])
  private async get(req: Request, res: Response) {
    const auth = res.locals.auth as AuthResponse;
    const {id} = req.params;

    const campaign = await CampaignService.get(auth.projectId, id!);

    return res.json({
      success: true,
      data: campaign,
    });
  }

  /**
   * Update a campaign
   * PUT /campaigns/:id
   */
  @Put(':id')
  @Middleware([requireAuth])
  private async update(req: Request, res: Response) {
    const auth = res.locals.auth as AuthResponse;
    const {id} = req.params;
    const {name, description, subject, body, from, fromName, replyTo, audienceType, audienceFilter, segmentId} =
      req.body;

    // Validate audience-specific fields if audienceType is being updated
    if (audienceType === CampaignAudienceType.SEGMENT && segmentId === undefined) {
      throw new HttpException(400, 'Segment ID is required for SEGMENT audience type');
    }

    if (audienceType === CampaignAudienceType.FILTERED && audienceFilter === undefined) {
      throw new HttpException(400, 'Audience filter is required for FILTERED audience type');
    }

    // Verify domain ownership and verification if 'from' is being updated
    if (from) {
      await DomainService.verifyEmailDomain(from, auth.projectId);
    }

    const campaign = await CampaignService.update(auth.projectId, id!, {
      name,
      description,
      subject,
      body,
      from,
      fromName,
      replyTo,
      audienceType,
      audienceFilter,
      segmentId,
    });

    return res.json({
      success: true,
      data: campaign,
    });
  }

  /**
   * Delete a campaign
   * DELETE /campaigns/:id
   */
  @Delete(':id')
  @Middleware([requireAuth])
  private async delete(req: Request, res: Response) {
    const auth = res.locals.auth as AuthResponse;
    const {id} = req.params;

    await CampaignService.delete(auth.projectId, id!);

    return res.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  }

  /**
   * Duplicate a campaign
   * POST /campaigns/:id/duplicate
   */
  @Post(':id/duplicate')
  @Middleware([requireAuth])
  private async duplicate(req: Request, res: Response) {
    const auth = res.locals.auth as AuthResponse;
    const {id} = req.params;

    const campaign = await CampaignService.duplicate(auth.projectId, id!);

    return res.status(201).json({
      success: true,
      data: campaign,
      message: 'Campaign duplicated successfully',
    });
  }

  /**
   * Send or schedule a campaign
   * POST /campaigns/:id/send
   */
  @Post(':id/send')
  @Middleware([requireAuth])
  private async send(req: Request, res: Response) {
    const auth = res.locals.auth as AuthResponse;
    const {id} = req.params;
    const scheduledFor = req.body?.scheduledFor;

    // Parse scheduledFor if provided
    let scheduledDate: Date | undefined;
    if (scheduledFor) {
      scheduledDate = new Date(scheduledFor);

      if (isNaN(scheduledDate.getTime())) {
        throw new HttpException(400, 'Invalid scheduledFor date format');
      }
    }

    const campaign = await CampaignService.send(auth.projectId, id!, scheduledDate);

    return res.json({
      success: true,
      data: campaign,
      message: scheduledDate ? `Campaign scheduled for ${scheduledDate.toISOString()}` : 'Campaign is being sent',
    });
  }

  /**
   * Cancel a campaign
   * POST /campaigns/:id/cancel
   */
  @Post(':id/cancel')
  @Middleware([requireAuth])
  private async cancel(req: Request, res: Response) {
    const auth = res.locals.auth as AuthResponse;
    const {id} = req.params;

    const campaign = await CampaignService.cancel(auth.projectId, id!);

    return res.json({
      success: true,
      data: campaign,
      message: 'Campaign cancelled successfully',
    });
  }

  /**
   * Get campaign statistics
   * GET /campaigns/:id/stats
   */
  @Get(':id/stats')
  @Middleware([requireAuth])
  private async stats(req: Request, res: Response) {
    const auth = res.locals.auth as AuthResponse;
    const {id} = req.params;

    const stats = await CampaignService.getStats(auth.projectId, id!);

    return res.json({
      success: true,
      data: stats,
    });
  }

  /**
   * Send a test email for a campaign
   * POST /campaigns/:id/test
   */
  @Post(':id/test')
  @Middleware([requireAuth])
  private async sendTest(req: Request, res: Response) {
    const auth = res.locals.auth as AuthResponse;
    const {id} = req.params;
    const {email} = CampaignSchemas.sendTest.parse(req.body);

    await CampaignService.sendTest(auth.projectId, id!, email);

    return res.json({
      success: true,
      message: `Test email sent to ${email}`,
    });
  }
}
