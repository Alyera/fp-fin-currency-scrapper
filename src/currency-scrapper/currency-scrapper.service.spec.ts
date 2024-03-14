import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyScrapperService } from './currency-scrapper.service';

describe('CurrencyScrapperService', () => {
  let service: CurrencyScrapperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CurrencyScrapperService],
    }).compile();

    service = module.get<CurrencyScrapperService>(CurrencyScrapperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
