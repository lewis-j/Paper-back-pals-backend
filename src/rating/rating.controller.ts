import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { JwtAuthGuard } from 'src/authentication/jwt-auth-guard';
import RequestWithUID from 'src/authentication/requestWithUID.interface';

@UseGuards(JwtAuthGuard)
@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  create(
    @Request() req: RequestWithUID,
    @Body() createRatingDto: CreateRatingDto,
  ) {
    const { user_id } = req.user;
    return this.ratingService.create(user_id, createRatingDto);
  }

  @Get('user')
  findUserRatings(@Request() req: RequestWithUID) {
    const { user_id } = req.user;
    return this.ratingService.findUserRatings(user_id);
  }

  @Get('book/:bookId')
  findBookRatings(@Param('bookId') bookId: string) {
    return this.ratingService.findBookRatings(bookId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ratingService.findOne(id);
  }

  @Patch(':id')
  update(
    @Request() req: RequestWithUID,
    @Param('id') id: string,
    @Body() updateRatingDto: UpdateRatingDto,
  ) {
    const { user_id } = req.user;
    return this.ratingService.update(id, user_id, updateRatingDto);
  }

  @Delete(':id')
  remove(@Request() req: RequestWithUID, @Param('id') id: string) {
    const { user_id } = req.user;
    return this.ratingService.remove(id, user_id);
  }
}
