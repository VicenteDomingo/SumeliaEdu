import { TestBed } from '@angular/core/testing';

import { ChildAttendanceService } from './child-attendance.service';

describe('ChildAttendanceService', () => {
  let service: ChildAttendanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChildAttendanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
