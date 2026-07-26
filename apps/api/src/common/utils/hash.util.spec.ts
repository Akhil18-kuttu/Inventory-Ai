import { HashUtil } from './hash.util';

describe('HashUtil', () => {
  it('should hash password and verify correctly', async () => {
    const password = 'mySafePassword123';
    const hash = await HashUtil.hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    
    const isMatch = await HashUtil.comparePassword(password, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await HashUtil.comparePassword('wrongPassword', hash);
    expect(isWrongMatch).toBe(false);
  });
});
