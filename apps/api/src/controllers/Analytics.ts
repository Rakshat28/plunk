import {Controller, Get, Middleware} from '@overnightjs/core';
import type {NextFunction, Request, Response} from 'express';

import type {AuthResponse} from '../middleware/auth.js';
import {requireAuth} from '../middleware/auth.js';
import {AnalyticsService} from '../services/AnalyticsService.js';
import {CatchAsync} from '../utils/asyncHandler.js';

@Controller('analytics')
export class Analytics {
  /**
   * GET /analytics/timeseries
   * Get time series data for email analytics
   *
   * Query params:
   * - startDate: ISO date string (defaults to 30 days ago, max 90 days)
   * - endDate: ISO date string (defaults to now)
   *
   * Returns daily aggregated email metrics (sent, opened, clicked, bounced, delivered)
   */
  @Get('timeseries')
  @Middleware([requireAuth])
  @CatchAsync
  public async getTimeSeries(req: Request, res: Response, next: NextFunction) {
    const auth = res.locals.auth as AuthResponse;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const timeSeries = await AnalyticsService.getTimeSeriesData(auth.projectId, startDate, endDate);

    return res.status(200).json(timeSeries);
  }

  /**
   * GET /analytics/top-campaigns
   * Get top performing campaigns by open rate
   *
   * Query params:
   * - limit: number (default 10)
   * - startDate: ISO date string (defaults to 30 days ago)
   * - endDate: ISO date string (defaults to now)
   */
  @Get('top-campaigns')
  @Middleware([requireAuth])
  @CatchAsync
  public async getTopCampaigns(req: Request, res: Response, next: NextFunction) {
    const auth = res.locals.auth as AuthResponse;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const topCampaigns = await AnalyticsService.getTopCampaigns(auth.projectId, limit, startDate, endDate);

    return res.status(200).json(topCampaigns);
  }
}
