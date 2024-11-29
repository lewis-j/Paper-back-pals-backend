import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserBooksService } from './user-books.service';

@Injectable()
export class UserBooksScheduler {
  constructor(private readonly userBooksService: UserBooksService) {}

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async handleDueBooks() {
    await this.userBooksService.checkDueBooks();
  }
}
