import { TestBed } from '@angular/core/testing';

import { TopOrdersService } from './top-orders.service';

describe('TopOrdersService', () => {
  let service: TopOrdersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TopOrdersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
