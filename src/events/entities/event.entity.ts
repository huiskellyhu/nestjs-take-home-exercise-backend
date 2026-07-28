import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum EventStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

@Entity()
export class Event {
  @PrimaryGeneratedColumn('uuid')
    id!: string;

  @Column()
    title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.TODO })
    status!: EventStatus;

  @CreateDateColumn()
    createdAt!: Date;

  @UpdateDateColumn()
    updatedAt!: Date;

  @Column()
    startTime!: Date;

  @Column()
    endTime!: Date;

  @ManyToMany(() => User, (user) => user.events)
    @JoinTable()
    invitees!: User[];
}