import { Request } from 'express';
import FirebaseUser from './firebaseUser.interface';

interface RequestWithUser extends Request {
  user: FirebaseUser;
}

export default RequestWithUser;
