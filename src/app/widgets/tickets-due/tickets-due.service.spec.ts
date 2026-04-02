import { TestBed } from '@angular/core/testing';

import { TicketsDueService } from './tickets-due.service';

describe('TicketsDueService', () => {
  let service: TicketsDueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TicketsDueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
