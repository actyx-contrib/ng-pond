import { TestBed } from '@angular/core/testing';

import { ActyxPondService } from './ng-pond.service';

describe('ActyxPondService', () => {
  let service: ActyxPondService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActyxPondService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
