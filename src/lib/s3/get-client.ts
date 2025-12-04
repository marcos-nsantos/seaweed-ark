import { getSession } from '@/lib/auth';
import { createS3Client } from './client';
import type { S3Client } from '@aws-sdk/client-s3';

export async function getAuthenticatedS3Client(): Promise<S3Client> {
  const session = await getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  return createS3Client({
    endpoint: session.endpoint,
    accessKeyId: session.accessKeyId,
    secretAccessKey: session.secretAccessKey,
    region: session.region,
  });
}
