import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { S3Client } from '@aws-sdk/client-s3';

const DEFAULT_EXPIRES_IN = 3600; // 1 hour

export async function getPresignedDownloadUrl(
  client: S3Client,
  bucket: string,
  key: string,
  expiresIn: number = DEFAULT_EXPIRES_IN,
  versionId?: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    VersionId: versionId,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export async function getPresignedUploadUrl(
  client: S3Client,
  bucket: string,
  key: string,
  contentType: string,
  expiresIn: number = DEFAULT_EXPIRES_IN
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}
