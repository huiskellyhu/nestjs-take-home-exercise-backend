import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Event, EventStatus } from './entities/event.entity';
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

  async mergeAll(userId: string): Promise<Event[]> {
    // Check for user
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Fetch this user's events, sorted chronologically
    const matchingEvents  = await this.eventRepo.find({
      where: { invitees: { id: userId } },
      order: { startTime: 'ASC' },
    });
    const eventIds = matchingEvents.map((e) => e.id);

    if (eventIds.length === 0) {
      return [];
    }

    // Re-fetch events by ID for full invitees list
    const events = await this.eventRepo.find({
      where: { id: In(eventIds) },
      relations: { invitees: true },
      order: { startTime: 'ASC' },
    });

    const merged: Event[] = [];
    let current: Event | null = null;

    for (const evt of events) {
      if (!current) {
        current = evt;
        continue;
      }

      // Overlap check:
      // does the new event start before (or exactly when) the current event ends?
      if (evt.startTime <= current.endTime) {
        current = this.mergeTwo(current, evt);
      } else {
        // No overlap: the interval is finalized, start a new one.
        merged.push(current);
        current = evt;
      }
    }
    if (current) {
      merged.push(current);
    }

    // only touch DB if changes were made
    if (merged.length === events.length) {
      return events;
    }

    await this.eventRepo.remove(events);
    return this.eventRepo.save(merged);
  }

  private mergeTwo(a: Event, b: Event): Event {
    const combinedInviteeIds = [...a.invitees, ...b.invitees].filter(
        (user, idx, arr) => arr.findIndex((u) => u.id === user.id) === idx,
    );

    return this.eventRepo.create({
      title: `${a.title}` + " | " + `${b.title}`,
      description: [a.description, b.description].filter(Boolean).join(' | '), // adjusts for optional description field
      status: this.pickStatus(a.status, b.status),
      startTime: a.startTime < b.startTime ? a.startTime : b.startTime,
      endTime: a.endTime > b.endTime ? a.endTime : b.endTime,
      invitees: combinedInviteeIds,
    });
  }

  private pickStatus(a: EventStatus, b: EventStatus): EventStatus {
    // if ONE of events is IN_PROGRESS, then IN_PROGRESS
    // else if BOTH events COMPLETED, then COMPLETED
    // else TODO
    if (a === EventStatus.IN_PROGRESS || b === EventStatus.IN_PROGRESS) {
      return EventStatus.IN_PROGRESS;
    }
    if (a === EventStatus.COMPLETED && b === EventStatus.COMPLETED) {
      return EventStatus.COMPLETED;
    }
    return EventStatus.TODO;
  }
}