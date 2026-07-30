import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUsersService = () => ({
  create: jest.fn(),
  findOne: jest.fn(),
});

describe('UsersController', () => {
  let controller: UsersController;
  let service: ReturnType<typeof mockUsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService() },
      ],
    }).compile();

    controller = module.get(UsersController);
    service = module.get(UsersService);
  });

  it('create() delegates to usersService.create with the DTO', async () => {
    const dto = { name: 'Alice' };
    const fakeUser = { id: 'u1', ...dto };
    service.create.mockResolvedValue(fakeUser);

    const result = await controller.create(dto as any);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(fakeUser);
  });

  it('findOne() delegates to usersService.findOne with the id param', async () => {
    const fakeUser = { id: 'u1', name: 'Alice', events: [] };
    service.findOne.mockResolvedValue(fakeUser);

    const result = await controller.findOne('u1');

    expect(service.findOne).toHaveBeenCalledWith('u1');
    expect(result).toEqual(fakeUser);
  });
});