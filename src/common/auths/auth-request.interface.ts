import { Request } from 'express';
import { JwtPayload } from './auth.payload';

export interface AuthRequest extends Request {
  user: JwtPayload;
}

export interface OptionalAuthRequest extends Request {
  user?: JwtPayload;
}
