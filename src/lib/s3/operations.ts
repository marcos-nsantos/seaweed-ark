import {
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  CopyObjectCommand,
  PutObjectCommand,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  PutBucketVersioningCommand,
  ListObjectVersionsCommand,
} from '@aws-sdk/client-s3';
import type { S3Client } from '@aws-sdk/client-s3';
import type { S3Bucket, S3Object, S3ListObjectsResponse, S3ObjectVersion } from '@/types/s3';

export async function listBuckets(client: S3Client): Promise<S3Bucket[]> {
  const response = await client.send(new ListBucketsCommand({}));

  return (
    response.Buckets?.map((bucket) => ({
      name: bucket.Name ?? '',
      creationDate: bucket.CreationDate,
    })) ?? []
  );
}

export async function createBucket(client: S3Client, bucketName: string): Promise<void> {
  await client.send(new CreateBucketCommand({ Bucket: bucketName }));
}

export async function deleteBucket(client: S3Client, bucketName: string): Promise<void> {
  await client.send(new DeleteBucketCommand({ Bucket: bucketName }));
}

export async function testConnection(client: S3Client): Promise<boolean> {
  try {
    await client.send(new ListBucketsCommand({}));
    return true;
  } catch {
    return false;
  }
}

export async function listObjects(
  client: S3Client,
  bucket: string,
  prefix?: string,
  continuationToken?: string
): Promise<S3ListObjectsResponse> {
  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      Delimiter: '/',
      ContinuationToken: continuationToken,
      MaxKeys: 100,
    })
  );

  // Deduplicate by key (SeaweedFS bug workaround) - keep the most recent version
  const deduplicatedContents = response.Contents
    ? Array.from(
        response.Contents.reduce((map, obj) => {
          const existing = map.get(obj.Key ?? '');
          if (!existing || (obj.LastModified && existing.LastModified && obj.LastModified > existing.LastModified)) {
            map.set(obj.Key ?? '', obj);
          }
          return map;
        }, new Map<string, (typeof response.Contents)[number]>()).values()
      )
    : [];

  const objects: S3Object[] = deduplicatedContents
    .filter((obj) => obj.Key !== prefix)
    .map((obj) => ({
      key: obj.Key ?? '',
      size: obj.Size ?? 0,
      lastModified: obj.LastModified ?? new Date(),
      etag: obj.ETag,
      isFolder: false,
    }));

  const prefixes = response.CommonPrefixes?.map((p) => p.Prefix ?? '').filter(Boolean) ?? [];

  const folders: S3Object[] = prefixes.map((p) => ({
    key: p,
    size: 0,
    lastModified: new Date(),
    isFolder: true,
  }));

  return {
    objects: [...folders, ...objects],
    prefixes,
    isTruncated: response.IsTruncated ?? false,
    continuationToken: response.NextContinuationToken,
  };
}

export async function deleteObject(client: S3Client, bucket: string, key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function copyObject(
  client: S3Client,
  sourceBucket: string,
  sourceKey: string,
  destBucket: string,
  destKey: string
): Promise<void> {
  await client.send(
    new CopyObjectCommand({
      Bucket: destBucket,
      Key: destKey,
      CopySource: `${sourceBucket}/${sourceKey}`,
    })
  );
}

export async function createFolder(
  client: S3Client,
  bucket: string,
  folderPath: string
): Promise<void> {
  const key = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: '',
    })
  );
}

export async function bucketExists(client: S3Client, bucket: string): Promise<boolean> {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return true;
  } catch {
    return false;
  }
}

export async function renameObject(
  client: S3Client,
  bucket: string,
  sourceKey: string,
  destKey: string
): Promise<void> {
  // S3 doesn't have native rename - we copy then delete
  await copyObject(client, bucket, sourceKey, bucket, destKey);
  await deleteObject(client, bucket, sourceKey);
}

export async function moveObject(
  client: S3Client,
  sourceBucket: string,
  sourceKey: string,
  destBucket: string,
  destKey: string
): Promise<void> {
  await copyObject(client, sourceBucket, sourceKey, destBucket, destKey);
  await deleteObject(client, sourceBucket, sourceKey);
}

export type VersioningStatus = 'Enabled' | 'Suspended' | 'Disabled';

export async function getBucketVersioning(
  client: S3Client,
  bucket: string
): Promise<VersioningStatus> {
  const response = await client.send(new GetBucketVersioningCommand({ Bucket: bucket }));
  return (response.Status as VersioningStatus) ?? 'Disabled';
}

export async function setBucketVersioning(
  client: S3Client,
  bucket: string,
  enabled: boolean
): Promise<void> {
  await client.send(
    new PutBucketVersioningCommand({
      Bucket: bucket,
      VersioningConfiguration: {
        Status: enabled ? 'Enabled' : 'Suspended',
      },
    })
  );
}

export async function listObjectVersions(
  client: S3Client,
  bucket: string,
  key: string
): Promise<S3ObjectVersion[]> {
  const response = await client.send(
    new ListObjectVersionsCommand({
      Bucket: bucket,
      Prefix: key,
    })
  );

  const versions: S3ObjectVersion[] = [];

  // Add regular versions
  response.Versions?.forEach((v) => {
    if (v.Key === key) {
      versions.push({
        key: v.Key,
        versionId: v.VersionId ?? 'null',
        isLatest: v.IsLatest ?? false,
        lastModified: v.LastModified ?? new Date(),
        size: v.Size ?? 0,
        etag: v.ETag,
        isDeleteMarker: false,
      });
    }
  });

  // Add delete markers
  response.DeleteMarkers?.forEach((dm) => {
    if (dm.Key === key) {
      versions.push({
        key: dm.Key,
        versionId: dm.VersionId ?? 'null',
        isLatest: dm.IsLatest ?? false,
        lastModified: dm.LastModified ?? new Date(),
        size: 0,
        isDeleteMarker: true,
      });
    }
  });

  // Sort by lastModified descending (newest first)
  versions.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

  return versions;
}
