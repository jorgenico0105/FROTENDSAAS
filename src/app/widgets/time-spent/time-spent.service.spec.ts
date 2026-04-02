import { TestBed } from '@angular/core/testing';

import { TimeSpentService } from './time-spent.service';

describe('TimeSpentService', () => {
  let service: TimeSpentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimeSpentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
