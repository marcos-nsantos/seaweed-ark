import { S3Client } from '@aws-sdk/client-s3';

export type S3Credentials = {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
};

export function createS3Client(credentials: S3Credentials): S3Client {
  return new S3Client({
    endpoint: credentials.endpoint,
    region: credentials.region ?? 'us-east-1',
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
    forcePathStyle: true,
  });
}
