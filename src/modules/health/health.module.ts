import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { ExternalHealthIndicator } from './indicators/external-health.indicator';
import { MailModule } from '../mail/mail.module';
import { CloudinaryProvider } from '../../config/cloudinary.config';

@Module({
  imports: [TerminusModule, MailModule],
  controllers: [HealthController],
  providers: [ExternalHealthIndicator, CloudinaryProvider],
})
export class HealthModule {}
