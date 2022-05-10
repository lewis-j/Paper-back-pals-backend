import { Test, TestingModule } from '@nestjs/testing';
import { UserBooksService } from './user-books.service';

describe('UserBooksService', () => {
  let service: UserBooksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserBooksService],
    }).compile();

    service = module.get<UserBooksService>(UserBooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
