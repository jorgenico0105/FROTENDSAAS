import { TestBed } from '@angular/core/testing';

import { AnnualProfitService } from './annual-profit.service';

describe('AnnualProfitService', () => {
  let service: AnnualProfitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnnualProfitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
