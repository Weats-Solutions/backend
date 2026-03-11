import { User } from './user';
import { Employee } from './employee';
import { Establishment } from './establishment';

export interface CustomRequest extends Request {
  user?: User;
  employee?: Employee;
  establishment?: Establishment;
}
