const { createClient } = require('@supabase/supabase-js');
const { STORAGE_BUCKETS, BUCKET_POLICIES } = require('../utils/fileValidation');

let supabaseClient = null;
let initializedBuckets = new Set();

/**
 * Get or initialize the Supabase client
 */
const getSupabaseClient = () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return supabaseClient;
  } catch (error) {
    console.warn('[Supabase Storage] Initialization warning:', error.message);
    return null;
  }
};

/**
 * Check if Supabase storage is actively configured with valid environment variables
 */
const isConfigured = () => {
  return !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY));
};

/**
 * Ensure standard buckets exist in Supabase storage
 */
const ensureBucketsExist = async () => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { data: buckets, error } = await client.storage.listBuckets();
    if (error) {
      console.warn('[Supabase Storage] listBuckets error:', error.message);
      return false;
    }

    const existingBucketNames = new Set((buckets || []).map((b) => b.name));

    for (const [bucketKey, bucketName] of Object.entries(STORAGE_BUCKETS)) {
      if (!existingBucketNames.has(bucketName) && !initializedBuckets.has(bucketName)) {
        const policy = BUCKET_POLICIES[bucketName] || { isPublic: false };
        const { error: createErr } = await client.storage.createBucket(bucketName, {
          public: policy.isPublic,
          fileSizeLimit: policy.maxSizeBytes,
        });

        if (createErr && !createErr.message?.includes('already exists')) {
          console.warn(`[Supabase Storage] Failed to create bucket "${bucketName}":`, createErr.message);
        } else {
          initializedBuckets.add(bucketName);
        }
      } else {
        initializedBuckets.add(bucketName);
      }
    }
    return true;
  } catch (err) {
    console.warn('[Supabase Storage] ensureBucketsExist exception:', err.message);
    return false;
  }
};

/**
 * Upload a file buffer to a Supabase bucket
 */
const uploadFile = async ({ bucket, objectPath, buffer, mimeType, upsert = true }) => {
  const client = getSupabaseClient();

  if (!client || process.env.NODE_ENV === 'test' && !process.env.SUPABASE_URL) {
    // Graceful offline/test mode: Return predictable mock metadata
    return {
      success: true,
      data: {
        bucket,
        path: objectPath,
        fullPath: `${bucket}/${objectPath}`,
      },
      isMock: true,
    };
  }

  try {
    const { data, error } = await client.storage.from(bucket).upload(objectPath, buffer, {
      contentType: mimeType || 'application/octet-stream',
      upsert,
    });

    if (error) {
      console.error(`[Supabase Storage] Upload error in bucket "${bucket}":`, error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error(`[Supabase Storage] Upload exception in bucket "${bucket}":`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Get public URL for public bucket assets
 */
const getPublicUrl = (bucket, objectPath) => {
  if (!objectPath) return '';

  const client = getSupabaseClient();
  if (!client || process.env.NODE_ENV === 'test' && !process.env.SUPABASE_URL) {
    const baseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
    return `${baseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
  }

  const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
  return data?.publicUrl || '';
};

/**
 * Generate a short-lived signed URL for private bucket assets
 */
const getSignedUrl = async (bucket, objectPath, expiresIn = 3600) => {
  if (!objectPath) return '';

  const client = getSupabaseClient();
  if (!client || process.env.NODE_ENV === 'test' && !process.env.SUPABASE_URL) {
    const baseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
    const expiresTimestamp = Math.floor(Date.now() / 1000) + expiresIn;
    return `${baseUrl}/storage/v1/object/sign/${bucket}/${objectPath}?token=mock_signed_token&expires=${expiresTimestamp}`;
  }

  try {
    const { data, error } = await client.storage.from(bucket).createSignedUrl(objectPath, expiresIn);
    if (error) {
      console.error(`[Supabase Storage] createSignedUrl error for "${objectPath}":`, error.message);
      return '';
    }
    return data?.signedUrl || '';
  } catch (err) {
    console.error(`[Supabase Storage] createSignedUrl exception for "${objectPath}":`, err.message);
    return '';
  }
};

/**
 * Download a file buffer from Supabase storage
 */
const downloadFile = async (bucket, objectPath) => {
  const client = getSupabaseClient();
  if (!client || (process.env.NODE_ENV === 'test' && !process.env.SUPABASE_URL)) {
    return {
      success: true,
      buffer: Buffer.from('%PDF-1.4 mock test file buffer'),
      contentType: 'application/pdf',
      isMock: true,
    };
  }


  try {
    const { data, error } = await client.storage.from(bucket).download(objectPath);
    if (error) {
      return { success: false, error: error.message };
    }
    const arrayBuffer = await data.arrayBuffer();
    return { success: true, buffer: Buffer.from(arrayBuffer), contentType: data.type };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Delete a file from a Supabase bucket
 */
const deleteFile = async (bucket, objectPath) => {
  if (!objectPath) return { success: true };

  const client = getSupabaseClient();
  if (!client || process.env.NODE_ENV === 'test' && !process.env.SUPABASE_URL) {
    return { success: true, isMock: true };
  }

  try {
    const { data, error } = await client.storage.from(bucket).remove([objectPath]);
    if (error) {
      console.error(`[Supabase Storage] Delete error for "${objectPath}":`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    console.error(`[Supabase Storage] Delete exception for "${objectPath}":`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Safely replace a file in Supabase storage
 */
const replaceFile = async ({ bucket, oldPath, newPath, buffer, mimeType }) => {
  // 1. Upload new file first
  const uploadResult = await uploadFile({
    bucket,
    objectPath: newPath,
    buffer,
    mimeType,
  });

  if (!uploadResult.success) {
    return uploadResult;
  }

  // 2. Delete old file if different path
  if (oldPath && oldPath !== newPath) {
    await deleteFile(bucket, oldPath);
  }

  return uploadResult;
};

/**
 * Cleanup orphaned file when subsequent database write or operation fails
 */
const cleanupOrphan = async ({ bucket, objectPath }) => {
  if (!objectPath) return;
  try {
    console.warn(`[Supabase Storage] Rolling back orphaned file "${objectPath}" from bucket "${bucket}"`);
    await deleteFile(bucket, objectPath);
  } catch (err) {
    console.error(`[Supabase Storage] Failed to cleanup orphaned file "${objectPath}":`, err.message);
  }
};

module.exports = {
  getSupabaseClient,
  isConfigured,
  ensureBucketsExist,
  uploadFile,
  getPublicUrl,
  getSignedUrl,
  downloadFile,
  deleteFile,
  replaceFile,
  cleanupOrphan,
  STORAGE_BUCKETS,
  BUCKET_POLICIES,
};
