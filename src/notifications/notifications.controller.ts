import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/authentication/jwt-auth-guard';
import RequestWithUID from 'src/authentication/requestWithUID.interface';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationServices: NotificationsService) {}

  @Get()
  async getNotificationList(@Request() req: RequestWithUID) {
    const { user_id } = req.user;
    const notifications = await this.notificationServices.getNotifications(
      user_id,
    );
    console.log('notifications', notifications);
    return notifications;
  }
  @Put('isRead/:id')
  async setIsRead(@Param('id') notification_id) {
    const notification = await this.notificationServices.markAsRead(
      notification_id,
    );
    return { notification };
  }
}
