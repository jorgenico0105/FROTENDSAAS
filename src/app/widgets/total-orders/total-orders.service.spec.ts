import { TestBed } from '@angular/core/testing';

import { TotalOrdersService } from './total-orders.service';

describe('TotalOrdersService', () => {
  let service: TotalOrdersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TotalOrdersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
