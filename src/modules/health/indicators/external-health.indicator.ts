import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService, type HealthIndicatorResult } from '@nestjs/terminus';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../mail/mail.service';

interface CloudinaryPing {
  api: { ping: () => Promise<{ status?: string }> };
}

@Injectable()
export class ExternalHealthIndicator {
  constructor(
    private readonly healthIndicator: HealthIndicatorService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @Inject('CLOUDINARY') private readonly cloudinary: CloudinaryPing,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  // (si un servicio no responde, preferimos marcarlo `down` por timeout y seguir).
  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
    });
    try {
      return await Promise.race([promise, timeout]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async redis(key = 'redis'): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicator.check(key);
    try {
      const probeKey = 'health:probe';
      await this.withTimeout(this.cache.set(probeKey, 'ok', 5000), 5000);
      const value = await this.withTimeout(this.cache.get<string>(probeKey), 5000);
      await this.cache.del(probeKey);
      return value === 'ok' ? indicator.up() : indicator.down({ message: 'cache read-back mismatch' });
    } catch (error) {
      return indicator.down({ message: (error as Error).message });
    }
  }

  async cloudinaryStatus(key = 'cloudinary'): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicator.check(key);
    try {
      const res = await this.withTimeout(this.cloudinary.api.ping(), 8000);
      return res.status === 'ok'
        ? indicator.up()
        : indicator.down({ message: `unexpected status: ${String(res.status)}` });
    } catch (error) {
      return indicator.down({ message: (error as Error).message });
    }
  }

  async mercadoPago(key = 'mercadopago'): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicator.check(key);
    const token = this.config.get<string>('MP_ACCESS_TOKEN');
    if (!token) {
      return indicator.down({ message: 'MP_ACCESS_TOKEN not set' });
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch('https://api.mercadopago.com/v1/payment_methods', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      return res.ok ? indicator.up() : indicator.down({ message: `HTTP ${res.status}` });
    } catch (error) {
      return indicator.down({ message: (error as Error).message });
    } finally {
      clearTimeout(timer);
    }
  }

  // SMTP: verify() autentica contra el servidor de mail reusando el transporter del MailService.
  async smtp(key = 'smtp'): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicator.check(key);
    try {
      await this.withTimeout(this.mail.verifyConnection(), 8000);
      return indicator.up();
    } catch (error) {
      return indicator.down({ message: (error as Error).message });
    }
  }
}
