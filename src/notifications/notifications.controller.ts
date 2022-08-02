import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/authentication/jwt-auth-guard';
import RequestWithUID from 'src/authentication/requestWithUID.interface';
import { CreateNotificationDto } from './dto/CreateNotificationDto';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationServices: NotificationsService) {}

  // @Get(':id')
  // async getOneNotification(@Param('id') notification_id: string) {
  //   const notification = await this.notificationServices.getOneNotification(
  //     notification_id,
  //   );
  //   console.log('notification', notification);

  //   return notification;
  // }
  // @Post('fetchList')
  // async getNotificationList(@Body() arrayOfNoficationIds: string[]) {
  //   const notifications = await this.notificationServices.getManyNotifications(
  //     arrayOfNoficationIds,
  //   );
  //   return notifications;
  // }
  @Post('new/:id')
  async createNotification(
    @Param('id') recipient_id: string,
    @Request() req: RequestWithUID,
    @Body() notificationDto: CreateNotificationDto,
  ) {
    console.log('notificationDto', notificationDto);
    console.log('req.user', req.user);
    const { user_id: sender_id } = req.user;
    console.log('recipient_id', recipient_id);

    const newNot = await this.notificationServices.createNotification({
      sender_id,
      recipient_id,
      notificationPayload: notificationDto,
    });
    console.log('newNot', newNot);

    return newNot;
  }
}
