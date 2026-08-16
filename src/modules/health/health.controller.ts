import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator, HealthCheckResult } from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ExternalHealthIndicator } from './indicators/external-health.indicator';

@ApiTags('Health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly external: ExternalHealthIndicator,
  ) {}

  @Get('ready')
  @HealthCheck()
  @ApiOperation({
    summary: 'Readiness check — verifies all external dependencies (DB, Redis, Cloudinary, MercadoPago, SMTP)',
  })
  @ApiResponse({ status: 200, description: 'All dependencies are healthy' })
  @ApiResponse({ status: 503, description: 'One or more dependencies are down' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.external.redis('redis'),
      () => this.external.cloudinaryStatus('cloudinary'),
      () => this.external.mercadoPago('mercadopago'),
      () => this.external.smtp('smtp'),
    ]);
  }
}
