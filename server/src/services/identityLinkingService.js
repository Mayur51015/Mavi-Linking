const ExternalIdentity = require('../models/ExternalIdentity');

const normalizeExternalId = (platform, username, platformData) => {
  switch (platform) {
    case 'github':
      return String(
        platformData?.profile?.id ||
        platformData?.id ||
        platformData?.username ||
        username
      );

    case 'codeforces':
      return String(
        platformData?.handle ||
        username
      ).toLowerCase();

    case 'leetcode':
      return String(
        platformData?.username ||
        username
      ).toLowerCase();

    case 'stackoverflow':
      return String(
        platformData?.userId ||
        username
      );

    default:
      throw new Error('Unsupported platform');
  }
};

const createPlatformAccountId = (platform, externalUserId) =>
  `${platform}:${String(externalUserId).trim().toLowerCase()}`;

const verifyAndLinkIdentity = async ({
  userId,
  platform,
  username,
  platformData,
}) => {
  const externalUserId = normalizeExternalId(
    platform,
    username,
    platformData
  );

  const platformAccountId = createPlatformAccountId(
    platform,
    externalUserId
  );

  const existingIdentity = await ExternalIdentity.findOne({
    platformAccountId,
  });

  if (
    existingIdentity &&
    String(existingIdentity.userId) !== String(userId)
  ) {
    const error = new Error(
      `This ${platform} account is already linked to another MAVI Linking user.`
    );
    error.statusCode = 409;
    throw error;
  }

  const now = new Date();

  const identity = await ExternalIdentity.findOneAndUpdate(
    { platformAccountId },
    {
      $set: {
        userId,
        platform,
        externalUsername: username,
        externalUserId,
        platformAccountId,
        verificationStatus: 'verified',
        verificationMethod: 'platform_profile_lookup',
        verifiedAt: now,
        lastSuccessfulSync: now,
      },
      $setOnInsert: {
        linkedAt: now,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  return identity;
};

const unlinkIdentity = async ({ userId, platform }) => {
  return ExternalIdentity.findOneAndDelete({
    userId,
    platform,
  });
};

const getVerifiedIdentity = async ({ userId, platform }) =>
  ExternalIdentity.findOne({
    userId,
    platform,
    verificationStatus: 'verified',
  });

const getVerifiedIdentities = async (userId) =>
  ExternalIdentity.find({
    userId,
    verificationStatus: 'verified',
  }).lean();

module.exports = {
  verifyAndLinkIdentity,
  unlinkIdentity,
  getVerifiedIdentity,
  getVerifiedIdentities,
  normalizeExternalId,
  createPlatformAccountId,
};