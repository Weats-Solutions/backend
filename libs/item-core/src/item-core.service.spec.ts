import { Test, TestingModule } from '@nestjs/testing';
import { ItemCoreService } from './item-core.service';

describe('ItemCoreService', () => {
  let service: ItemCoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItemCoreService],
    }).compile();

    service = module.get<ItemCoreService>(ItemCoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
