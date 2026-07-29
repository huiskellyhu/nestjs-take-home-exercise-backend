import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event, EventStatus } from './entities/event.entity';
import { User } from '../users/entities/user.entity';

// jest.fn() creates a mock function whose return value we control
// with .mockResolvedValue()/.mockReturnValue().
const mockEventRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((data) => data), // mimic TypeORM: just returns what's passed in
  save: jest.fn(),
  remove: jest.fn(),
  delete: jest.fn(),
});

const mockUserRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
});

describe('EventsService', () => {
  let service: EventsService;
  let eventRepo: ReturnType<typeof mockEventRepo>;
  let userRepo: ReturnType<typeof mockUserRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(Event), useValue: mockEventRepo() },
        { provide: getRepositoryToken(User), useValue: mockUserRepo() },
      ],
    }).compile();

    service = module.get(EventsService);
    eventRepo = module.get(getRepositoryToken(Event));
    userRepo = module.get(getRepositoryToken(User));
  });

  describe('findOne', () => {
    it('returns the event when found', async () => {
      const fakeEvent = { id: '1', title: 'Standup' } as Event;
      eventRepo.findOne.mockResolvedValue(fakeEvent);

      const result = await service.findOne('1');

      expect(result).toEqual(fakeEvent);
    });

    it('throws NotFoundException when no event matches', async () => {
      eventRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('mergeAll', () => {
    const alice = { id: 'alice', name: 'Alice' } as User;
    const bob = { id: 'bob', name: 'Bob' } as User;

    it('merges two overlapping events and unions their invitees', async () => {
      userRepo.findOne.mockResolvedValue(alice);

      const eventA = {
        id: 'e1',
        title: 'Standup',
        description: undefined,
        status: EventStatus.TODO,
        startTime: new Date('2026-07-28T14:00:00.000Z'),
        endTime: new Date('2026-07-28T15:00:00.000Z'),
        invitees: [alice],
      } as Event;

      const eventB = {
        id: 'e2',
        title: 'Design Review',
        description: undefined,
        status: EventStatus.TODO,
        startTime: new Date('2026-07-28T14:45:00.000Z'),
        endTime: new Date('2026-07-28T16:00:00.000Z'),
        invitees: [alice, bob],
      } as Event;

      eventRepo.find
        .mockResolvedValueOnce([eventA, eventB]) // first call: filtered, no relations
        .mockResolvedValueOnce([eventA, eventB]); // second call: by ID, with relations
      eventRepo.save.mockImplementation((events) => Promise.resolve(events));

      const result = await service.mergeAll('alice');

      expect(result).toHaveLength(1);
      expect(result[0].startTime).toEqual(new Date('2026-07-28T14:00:00.000Z'));
      expect(result[0].endTime).toEqual(new Date('2026-07-28T16:00:00.000Z'));
      expect(result[0].invitees).toHaveLength(2);
      expect(result[0].invitees.map((u) => u.id).sort()).toEqual(['alice', 'bob']);
      expect(eventRepo.remove).toHaveBeenCalledWith([eventA, eventB]);
    });

    it('leaves non-overlapping events unmerged', async () => {
      userRepo.findOne.mockResolvedValue(alice);

      const eventA = {
        id: 'e1',
        startTime: new Date('2026-07-28T14:00:00.000Z'),
        endTime: new Date('2026-07-28T15:00:00.000Z'),
        invitees: [alice],
      } as Event;

      const eventC = {
        id: 'e3',
        startTime: new Date('2026-07-28T18:00:00.000Z'),
        endTime: new Date('2026-07-28T19:00:00.000Z'),
        invitees: [alice],
      } as Event;

      eventRepo.find.mockResolvedValue([eventA, eventC]);

      const result = await service.mergeAll('alice');

      // nothing overlapped, so mergeAll should return the
      // original events untouched, and never call remove/save
      expect(result).toEqual([eventA, eventC]);
      expect(eventRepo.remove).not.toHaveBeenCalled();
      expect(eventRepo.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown user', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.mergeAll('ghost')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});