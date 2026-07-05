import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OptionalAuthRequest } from 'src/common/auths/auth-request.interface';
import { JwtPayload } from 'src/common/auths/auth.payload';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  private readonly jwtSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const secret = this.configService.get<string>('SUPABASE_JWT_SECRET');
    if (!secret) {
      throw new Error('SUPABASE_JWT_SECRET is not configured');
    }
    this.jwtSecret = secret;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<OptionalAuthRequest>();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      return true;
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.jwtSecret,
      });
      request.user = {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        username: payload.username,
        role: payload.role,
        permissions: payload.permissions,
        exp: payload.exp,
        iat: payload.iat,
      };
    } catch {
      // Token inválido/expirado en un endpoint público → se trata como anónimo.
    }

    return true;
  }
}
