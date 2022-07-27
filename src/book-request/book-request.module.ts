import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookRequestService } from './book-request.service';
import { BookRequest, BookRequestSchema } from './schema/bookRequest.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BookRequest.name, schema: BookRequestSchema },
    ]),
  ],
  providers: [BookRequestService],
  exports: [BookRequestService],
})
export class BookRequestModule {}
