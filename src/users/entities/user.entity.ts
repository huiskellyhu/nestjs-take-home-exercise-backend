import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Event } from '../../events/entities/event.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
    id!: string;

  @Column()
    name!: string;

  @ManyToMany(() => Event, (event) => event.invitees)
    events!: Event[];
}