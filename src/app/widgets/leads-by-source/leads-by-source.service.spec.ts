import { TestBed } from '@angular/core/testing';

import { LeadsBySourceService } from './leads-by-source.service';

describe('LeadsBySourceService', () => {
  let service: LeadsBySourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeadsBySourceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
