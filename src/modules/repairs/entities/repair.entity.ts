import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DeviceType, RepairStatus, RepairUrgency } from '../enum/repairs.enum';
import { RepairComment } from './repair-comment.entity';

@Index(['status'])
@Index(['urgency'])
@Index(['createdAt'])
@Entity('repairs')
export class Repair {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80 })
  fullName: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'enum', enum: DeviceType })
  deviceType: DeviceType;

  @Column({ type: 'varchar', length: 100 })
  brand: string;

  @Column({ type: 'varchar', length: 100 })
  model: string;

  @Column({ type: 'text' })
  issueDescription: string;

  @Column({ type: 'enum', enum: RepairUrgency })
  urgency: RepairUrgency;

  @Column({ type: 'enum', enum: RepairStatus, default: RepairStatus.PENDING })
  status: RepairStatus;

  @Column({ type: 'text', nullable: true })
  adminNotes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RepairComment, (comment) => comment.repair)
  comments: RepairComment[];
}
