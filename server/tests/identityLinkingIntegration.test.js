const mongoose = require('mongoose');
const ExternalIdentity = require('../src/models/ExternalIdentity');
const {
  verifyAndLinkIdentity,
  unlinkIdentity,
} = require('../src/services/identityLinkingService');

describe('External identity ownership', () => {
  const userOne = new mongoose.Types.ObjectId();
  const userTwo = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await ExternalIdentity.deleteMany({});
  });

  afterAll(async () => {
    await ExternalIdentity.deleteMany({});
  });

  it('allows the first user to link an external account', async () => {
    const identity = await verifyAndLinkIdentity({
      userId: userOne,
      platform: 'github',
      username: 'developer-one',
      platformData: {
        profile: {
          id: 1001,
          username: 'developer-one',
        },
      },
    });

    expect(identity.userId.toString()).toBe(userOne.toString());
    expect(identity.verificationStatus).toBe('verified');
    expect(identity.verificationMethod).toBe(
      'platform_profile_lookup'
    );
    expect(identity.verifiedAt).toBeInstanceOf(Date);
  });

  it('rejects linking the same external account to another user', async () => {
    await verifyAndLinkIdentity({
      userId: userOne,
      platform: 'github',
      username: 'developer-one',
      platformData: {
        profile: {
          id: 1001,
          username: 'developer-one',
        },
      },
    });

    await expect(
      verifyAndLinkIdentity({
        userId: userTwo,
        platform: 'github',
        username: 'developer-one',
        platformData: {
          profile: {
            id: 1001,
            username: 'developer-one',
          },
        },
      })
    ).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('rejects duplicate identity ownership even with different username casing', async () => {
    await verifyAndLinkIdentity({
      userId: userOne,
      platform: 'leetcode',
      username: 'DeveloperOne',
      platformData: {
        username: 'DeveloperOne',
      },
    });

    await expect(
      verifyAndLinkIdentity({
        userId: userTwo,
        platform: 'leetcode',
        username: 'developerone',
        platformData: {
          username: 'developerone',
        },
      })
    ).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('allows a user to unlink one platform without affecting another', async () => {
    await verifyAndLinkIdentity({
      userId: userOne,
      platform: 'github',
      username: 'developer-one',
      platformData: {
        profile: {
          id: 1001,
        },
      },
    });

    await verifyAndLinkIdentity({
      userId: userOne,
      platform: 'leetcode',
      username: 'developer-one',
      platformData: {
        username: 'developer-one',
      },
    });

    await unlinkIdentity({
      userId: userOne,
      platform: 'github',
    });

    const githubIdentity = await ExternalIdentity.findOne({
      userId: userOne,
      platform: 'github',
    });

    const leetcodeIdentity = await ExternalIdentity.findOne({
      userId: userOne,
      platform: 'leetcode',
    });

    expect(githubIdentity).toBeNull();
    expect(leetcodeIdentity).not.toBeNull();
  });

  it('rejects unsupported platforms', async () => {
    await expect(
      verifyAndLinkIdentity({
        userId: userOne,
        platform: 'unknown',
        username: 'developer',
        platformData: {},
      })
    ).rejects.toThrow('Unsupported platform');
  });
});