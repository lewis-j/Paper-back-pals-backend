import { Request } from 'express';
import TokenPayload from './tokenPayload.interface';

interface RequestWithUID extends Request {
  user: TokenPayload;
}

export default RequestWithUID;
