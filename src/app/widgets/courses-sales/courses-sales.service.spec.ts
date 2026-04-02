import { TestBed } from '@angular/core/testing';

import { CoursesSalesService } from './courses-sales.service';

describe('CoursesSalesService', () => {
  let service: CoursesSalesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoursesSalesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
