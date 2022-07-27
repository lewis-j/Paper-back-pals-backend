import { Test, TestingModule } from '@nestjs/testing';
import { BookRequestService } from './book-request.service';

describe('BookRequestService', () => {
  let service: BookRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BookRequestService],
    }).compile();

    service = module.get<BookRequestService>(BookRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
