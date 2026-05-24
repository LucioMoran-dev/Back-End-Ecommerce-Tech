import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Repair } from './entities/repair.entity';
import { RepairComment } from './entities/repair-comment.entity';
import { MailQueueService } from '../mail/mail-queue_email.service';
import { RepairStatus } from './enum/repairs.enum';
import { PaginatedRepairsDto, RepairSearchQueryDto } from './dto/paginate.rapair.dto';
import { ICreateRepair, IRepairResponse, IRepairHistoryResponse, IUpdateRepairStatus } from './interface/repairs.interface';

@Injectable()
export class RepairsService {
  private readonly logger = new Logger(RepairsService.name);

  constructor(
    @InjectRepository(Repair)
    private readonly repairRepository: Repository<Repair>,
    @InjectRepository(RepairComment)
    private readonly repairCommentRepository: Repository<RepairComment>,
    private readonly mailQueueService: MailQueueService,
  ) {}

  private sanitizeInput(value: string): string {
    return value
      .replace(/[\r\n]/g, ' ')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  async submitRepairRequest(dto: ICreateRepair): Promise<{ message: string; repairId: string }> {
    const repair = this.repairRepository.create({
      fullName: this.sanitizeInput(dto.fullName),
      email: dto.email,
      phone: dto.phone,
      deviceType: dto.deviceType,
      brand: this.sanitizeInput(dto.brand),
      model: this.sanitizeInput(dto.model),
      issueDescription: this.sanitizeInput(dto.issueDescription),
      urgency: dto.urgency,
    });

    const saved = await this.repairRepository.save(repair);
    this.logger.log(`Repair request created: ${saved.id} from ${dto.email}`);

    await this.mailQueueService.queueRepairConfirmation(
      saved.email,
      saved.fullName,
      saved.id,
      saved.deviceType,
      saved.brand,
      saved.model,
      saved.issueDescription,
    );

    await this.mailQueueService.queueRepairNotificationToAdmin(
      saved.fullName,
      saved.email,
      saved.phone,
      saved.deviceType,
      saved.brand,
      saved.model,
      saved.issueDescription,
      saved.urgency,
    );

    return { message: 'Solicitud de reparación enviada correctamente', repairId: saved.id };
  }

  async getAllRepairs(searchQuery: RepairSearchQueryDto): Promise<PaginatedRepairsDto> {
    const { page, limit, status, urgency } = searchQuery;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (urgency) where.urgency = urgency;

    const [items, total] = await this.repairRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      total,
      pages: Math.ceil(total / limit),
      items,
    };
  }

  async getRepairById(id: string): Promise<IRepairResponse> {
    const repair = await this.repairRepository.findOne({ where: { id } });
    if (!repair) {
      throw new NotFoundException(`Reparación con ID ${id} no encontrada`);
    }
    return repair;
  }

  async updateRepairStatus(id: string, dto: IUpdateRepairStatus, adminId: string): Promise<Repair> {
    const repair = await this.getRepairById(id);

    if (repair.status === RepairStatus.COMPLETED || repair.status === RepairStatus.CANCELLED) {
      throw new BadRequestException(`No se puede cambiar el estado de una reparación ${repair.status}`);
    }

    repair.status = dto.status;
    if (dto.adminNotes !== undefined) {
      repair.adminNotes = dto.adminNotes;
    }

    const updated = await this.repairRepository.save(repair);
    this.logger.log(`Repair ${id} status updated to ${dto.status}`);

    const commentText = dto.adminNotes || `Estado actualizado a ${dto.status}`;
    await this.saveComment({
      repairId: id,
      adminId,
      comment: commentText,
      statusSnapshot: dto.status,
    });

    await this.mailQueueService.queueRepairStatusUpdate(
      updated.email,
      updated.fullName,
      updated.id,
      updated.status,
      updated.adminNotes,
    );

    return updated;
  }

  private async saveComment(data: {
    repairId: string;
    adminId: string;
    comment: string;
    statusSnapshot: RepairStatus;
  }): Promise<RepairComment> {
    const comment = this.repairCommentRepository.create(data);
    return this.repairCommentRepository.save(comment);
  }

  async getRepairHistory(repairId: string): Promise<IRepairHistoryResponse> {
    const repair = await this.getRepairById(repairId);

    const comments = await this.repairCommentRepository.find({
      where: { repairId },
      order: { createdAt: 'ASC' },
      relations: ['admin'],
    });

    return {
      repair,
      comments: comments.map((c) => ({
        id: c.id,
        adminId: c.adminId,
        adminName: c.admin?.name ?? 'Admin',
        comment: c.comment,
        statusSnapshot: c.statusSnapshot,
        createdAt: c.createdAt,
      })),
    };
  }
}
