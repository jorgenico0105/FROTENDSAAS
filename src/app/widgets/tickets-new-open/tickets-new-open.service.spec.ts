import { TestBed } from '@angular/core/testing';

import { TicketsNewOpenService } from './tickets-new-open.service';

describe('TicketsNewOpenService', () => {
  let service: TicketsNewOpenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TicketsNewOpenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
