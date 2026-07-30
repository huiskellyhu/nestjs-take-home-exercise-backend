import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

const mockUserRepo = () => ({
  create: jest.fn((data) => data),
  save: jest.fn(),
  findOne: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: ReturnType<typeof mockUserRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo() },
      ],
    }).compile();

    service = module.get(UsersService);
    userRepo = module.get(getRepositoryToken(User));
  });

  describe('create', () => {
    it('creates and saves a user with the given name', async () => {
      userRepo.save.mockImplementation((user) => Promise.resolve({ id: 'u1', ...user }));

      const result = await service.create({ name: 'Alice' });

      expect(userRepo.create).toHaveBeenCalledWith({ name: 'Alice' });
      expect(result).toEqual({ id: 'u1', name: 'Alice' });
    });
  });

  describe('findOne', () => {
    it('returns the user with their events when found', async () => {
      const fakeUser = { id: 'u1', name: 'Alice', events: [] } as unknown as User;
      userRepo.findOne.mockResolvedValue(fakeUser);

      const result = await service.findOne('u1');

      // confirms the relation option is actually being requested
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'u1' },
        relations: { events: true },
      });
      expect(result).toEqual(fakeUser);
    });

    it('throws NotFoundException when no user matches', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});