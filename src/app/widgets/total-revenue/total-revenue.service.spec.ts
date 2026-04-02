import { TestBed } from '@angular/core/testing';

import { TotalRevenueService } from './total-revenue.service';

describe('TotalRevenueService', () => {
  let service: TotalRevenueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TotalRevenueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
