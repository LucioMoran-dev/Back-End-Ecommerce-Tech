import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repair } from './entities/repair.entity';
import { RepairComment } from './entities/repair-comment.entity';
import { RepairsController } from './repairs.controller';
import { RepairsService } from './repairs.service';
import { MailModule } from '../mail/mail.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Repair, RepairComment]), MailModule, JwtModule],
  controllers: [RepairsController],
  providers: [RepairsService],
})
export class RepairsModule {}
