jest.mock('../src/models/DeveloperActivityEvent');

const DeveloperActivityEvent = require('../src/models/DeveloperActivityEvent');
const { recordEvent, reconstructStateAsOf } = require('../src/services/activityEventService');

describe('activityEventService.recordEvent', () => {
  afterEach(() => jest.clearAllMocks());

  it('creates a new immutable event on first sync', async () => {
    DeveloperActivityEvent.create.mockResolvedValue({ _id: '1', dedupeKey: 'abc' });

    const result = await recordEvent({
      userId: 'u1',
      platform: 'leetcode',
      eventType: 'RATING_CHANGE',
      previousValue: { contestRating: 1400 },
      newValue: { contestRating: 1450 },
      syncVersion: '2026-08-27T00:00:00.000Z',
    });

    expect(DeveloperActivityEvent.create).toHaveBeenCalledTimes(1);
    expect(result.created).toBe(true);
  });

  it('does not create a duplicate event for a repeated synchronization', async () => {
    const duplicateError = new Error('duplicate key');
    duplicateError.code = 11000;
    DeveloperActivityEvent.create.mockRejectedValue(duplicateError);
    DeveloperActivityEvent.findOne.mockResolvedValue({ _id: 'existing', dedupeKey: 'abc' });

    const payload = {
      userId: 'u1',
      platform: 'leetcode',
      eventType: 'RATING_CHANGE',
      previousValue: { contestRating: 1400 },
      newValue: { contestRating: 1450 },
      syncVersion: '2026-08-27T00:00:00.000Z',
    };

    const result = await recordEvent(payload);

    expect(DeveloperActivityEvent.create).toHaveBeenCalledTimes(1);
    expect(result.created).toBe(false);
    expect(result.event._id).toBe('existing');
  });
});

describe('activityEventService.reconstructStateAsOf', () => {
  afterEach(() => jest.clearAllMocks());

  it('resolves to the correct value when platform updates arrive out of order', async () => {
    // Simulates a platform delivering an older change after a newer one.
    const olderEvent = {
      platform: 'leetcode',
      eventType: 'RATING_CHANGE',
      newValue: { contestRating: 1400 },
      occurredAt: new Date('2026-01-01T00:00:00.000Z'),
      syncVersion: 'v1',
    };
    const newerEvent = {
      platform: 'leetcode',
      eventType: 'RATING_CHANGE',
      newValue: { contestRating: 1500 },
      occurredAt: new Date('2026-02-01T00:00:00.000Z'),
      syncVersion: 'v2',
    };

    DeveloperActivityEvent.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([olderEvent, newerEvent]),
      }),
    });

    const { state } = await reconstructStateAsOf('u1', '2026-03-01T00:00:00.000Z');

    expect(state['leetcode:RATING_CHANGE'].value).toEqual({ contestRating: 1500 });
  });
});