import { TestBed } from '@angular/core/testing';

import { TotalCustomersService } from './total-customers.service';

describe('TotalCustomersService', () => {
  let service: TotalCustomersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TotalCustomersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
