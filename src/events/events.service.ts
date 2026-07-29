import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { User } from '../users/entities/user.entity';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async create(dto: CreateEventDto): Promise<Event> {
    // Look up the actual User entities for any invitee IDs sent in
    // If none, default to empty array
    const invitees = dto.inviteeIds?.length
      ? await this.userRepo.find({ where: { id: In(dto.inviteeIds) } })
      : [];

    // eventRepo.create() builds in-memory Event instance to set fields
    const event = this.eventRepo.create({
      title: dto.title,
      description: dto.description,
      status: dto.status,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      invitees,
    });

    // .save() executes the INSERT (also writes join tables)
    return this.eventRepo.save(event);
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: { invitees: true },
    });
    if (!event) {
      throw new NotFoundException(`Event ${id} not found`);
    }
    return event;
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventRepo.delete(id);

    // throws if no event to delete
    if (result.affected === 0) {
      throw new NotFoundException(`Event ${id} not found`);
    }
  }
}