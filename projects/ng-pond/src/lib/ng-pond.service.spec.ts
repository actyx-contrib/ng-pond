import { FishErrorContext, FishId } from '@actyx/pond';
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

describe('ActyxPondServiceOptions', () => {
  let service: ActyxPondService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: 'pondOptions',
          useValue: {
            defaultSnapshotThreshold: 42,
            fishErrorReporter: (
              err: unknown,
              fishId: FishId,
              detail: FishErrorContext
            ) => console.error(err, fishId, detail),
          },
        },
        ActyxPondService,
      ],
    });
    service = TestBed.inject(ActyxPondService);
  });

  it('should be passed to pond', async () => {
    expect(
      await service
        .getPond()
        //@ts-expect-error
        .then((pond) => pond.opts)
        .then((opts) => opts.defaultSnapshotThreshold)
    ).toBe(42);
  });
});
