import { TestBed } from '@angular/core/testing';

import { MpOverviewService } from './mp-overview.service';

describe('MpOverviewService', () => {
  let service: MpOverviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MpOverviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
