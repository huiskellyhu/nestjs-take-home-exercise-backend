import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

const mockEventsService = () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  mergeAll: jest.fn(),
});

describe('EventsController', () => {
  let controller: EventsController;
  let service: ReturnType<typeof mockEventsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        { provide: EventsService, useValue: mockEventsService() },
      ],
    }).compile();

    controller = module.get(EventsController);
    service = module.get(EventsService);
  });

  it('create() delegates to eventsService.create with the DTO', async () => {
    const dto = { title: 'Standup', startTime: '...', endTime: '...' };
    const fakeEvent = { id: '1', ...dto };
    service.create.mockResolvedValue(fakeEvent);

    const result = await controller.create(dto as any);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(fakeEvent);
  });

  it('findOne() delegates to eventsService.findOne with the id param', async () => {
    const fakeEvent = { id: '1', title: 'Standup' };
    service.findOne.mockResolvedValue(fakeEvent);

    const result = await controller.findOne('1');

    expect(service.findOne).toHaveBeenCalledWith('1');
    expect(result).toEqual(fakeEvent);
  });

  it('remove() delegates to eventsService.remove with the id param', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove('1');

    expect(service.remove).toHaveBeenCalledWith('1');
  });

  it('mergeAll() delegates to eventsService.mergeAll with the userId param', async () => {
    const merged = [{ id: '1' }];
    service.mergeAll.mockResolvedValue(merged);

    const result = await controller.mergeAll('alice');

    expect(service.mergeAll).toHaveBeenCalledWith('alice');
    expect(result).toEqual(merged);
  });
});