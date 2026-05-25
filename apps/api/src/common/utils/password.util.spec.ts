import * as bcrypt from 'bcrypt';
import { hashPassword } from './password.util';

jest.setTimeout(30000);

describe('hashPassword()', () => {
  it('produz um hash bcrypt (começa com $2b$)', async () => {
    const hash = await hashPassword('MinhaSenh@1');
    expect(hash).toMatch(/^\$2b\$/);
  });

  it('produz hashes diferentes para a mesma entrada (salt único)', async () => {
    const hash1 = await hashPassword('MesmaSenha1');
    const hash2 = await hashPassword('MesmaSenha1');
    expect(hash1).not.toBe(hash2);
  });

  it('o hash verifica corretamente com bcrypt.compare', async () => {
    const plain = 'TesteSenha123';
    const hash = await hashPassword(plain);
    const valid = await bcrypt.compare(plain, hash);
    expect(valid).toBe(true);
  });

  it('hash inválido não verifica com bcrypt.compare', async () => {
    const hash = await hashPassword('SenhaCorreta1');
    const valid = await bcrypt.compare('SenhaErrada1', hash);
    expect(valid).toBe(false);
  });

  it('usa 12 rounds de custo (embutido na string do hash)', async () => {
    const hash = await hashPassword('CheckRounds1');
    // Formato: $2b$12$...
    expect(hash).toMatch(/^\$2b\$12\$/);
  });
});
