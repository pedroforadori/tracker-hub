import * as bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, BCRYPT_ROUNDS);
