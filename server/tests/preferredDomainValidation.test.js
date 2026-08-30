const mongoose = require('mongoose');
const User = require('../src/models/User');
const { CANONICAL_DOMAINS, normalizeDomain } = require('../src/constants/domainOptions');

describe('preferredDomain and preferredRole Validation Suite', () => {
  test('normalizeDomain converts role strings to canonical domain options', () => {
    expect(normalizeDomain('Full-Stack Developer')).toBe('Full-Stack Development');
    expect(normalizeDomain('full stack developer')).toBe('Full-Stack Development');
    expect(normalizeDomain('frontend developer')).toBe('Frontend Development');
    expect(normalizeDomain('Software Development')).toBe('Software Development');
    expect(normalizeDomain('')).toBe('');
    expect(normalizeDomain(null)).toBe('');
  });

  test('User schema accepts canonical domains and normalizes legacy roles automatically', () => {
    const user1 = new User({
      name: 'Test Student',
      email: 'test.student@example.com',
      password: 'Password@123',
      preferredDomain: 'Full-Stack Developer',
    });

    expect(user1.preferredDomain).toBe('Full-Stack Development');
    const err = user1.validateSync();
    expect(err).toBeUndefined();
  });

  test('User schema validates against canonical domains', () => {
    for (const domain of CANONICAL_DOMAINS) {
      const user = new User({
        name: 'Test Dev',
        email: `test.${domain.toLowerCase().replace(/[^a-z]/g, '') || 'empty'}@example.com`,
        password: 'Password@123',
        preferredDomain: domain,
      });
      const err = user.validateSync();
      expect(err).toBeUndefined();
    }
  });

  test('User schema saves preferredRole independently from preferredDomain', () => {
    const user = new User({
      name: 'Role Test User',
      email: 'role.test@example.com',
      password: 'Password@123',
      preferredDomain: 'Software Development',
      preferredRole: 'Full-Stack Developer',
    });

    expect(user.preferredDomain).toBe('Software Development');
    expect(user.preferredRole).toBe('Full-Stack Developer');
    const err = user.validateSync();
    expect(err).toBeUndefined();
  });
});
