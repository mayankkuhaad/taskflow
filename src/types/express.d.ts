import { UserPayload } from '../common/interfaces/user-payload.interface';

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserPayload;
  }
}