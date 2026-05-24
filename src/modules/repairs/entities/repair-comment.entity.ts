import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Repair } from './repair.entity';
import { Users } from '../../users/entities/users.entity';
import { RepairStatus } from '../enum/repairs.enum';

@Entity('repair_comments')
export class RepairComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  repairId: string;

  @Column({ type: 'uuid' })
  adminId: string;

  @Column({ type: 'text' })
  comment: string;

  @Column({ type: 'enum', enum: RepairStatus })
  statusSnapshot: RepairStatus;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Repair, (repair) => repair.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'repairId' })
  repair: Repair;

  @ManyToOne(() => Users, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'adminId' })
  admin: Users;
}
