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
  GetObjectAclCommand,
  PutObjectAclCommand,
} from '@aws-sdk/client-s3';
import type { S3Client, ObjectCannedACL } from '@aws-sdk/client-s3';
import type { S3Bucket, S3Object, S3ListObjectsResponse, S3ObjectVersion, S3ObjectAcl } from '@/types/s3';
import { FolderNotEmptyError } from '@/lib/errors';

const LIST_VERSIONS_PAGE_SIZE = 1000;

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
  // Use ListObjectVersionsCommand only - more reliable with SeaweedFS
  const versionsResponse = await client.send(
    new ListObjectVersionsCommand({
      Bucket: bucket,
      Prefix: prefix,
      KeyMarker: continuationToken,
      MaxKeys: LIST_VERSIONS_PAGE_SIZE,
    })
  );

  // Build set of keys that have delete marker as latest version
  const deletedKeys = new Set<string>();
  versionsResponse.DeleteMarkers?.forEach((marker) => {
    if (marker.IsLatest && marker.Key) {
      deletedKeys.add(marker.Key);
    }
  });

  // Process versions - simulate delimiter manually
  const prefixLen = prefix?.length ?? 0;
  const folderSet = new Set<string>();
  const fileMap = new Map<string, { size: number; lastModified: Date; etag?: string; isDeleted: boolean }>();

  // Index versions by key for O(1) lookup when processing delete markers
  const versionsByKey = new Map<string, { size: number; etag?: string }>();
  versionsResponse.Versions?.forEach((v) => {
    if (v.Key && !versionsByKey.has(v.Key)) {
      versionsByKey.set(v.Key, { size: v.Size ?? 0, etag: v.ETag });
    }
  });

  // Process active versions
  versionsResponse.Versions?.forEach((version) => {
    if (!version.Key || !version.IsLatest) return;
    if (version.Key === prefix) return;

    const relativePath = version.Key.slice(prefixLen);
    const slashIndex = relativePath.indexOf('/');

    if (slashIndex === -1) {
      // Direct file (no slash in relative path)
      fileMap.set(version.Key, {
        size: version.Size ?? 0,
        lastModified: version.LastModified ?? new Date(),
        etag: version.ETag,
        isDeleted: deletedKeys.has(version.Key),
      });
    } else {
      // Folder - extract the folder prefix
      const folderPrefix = (prefix ?? '') + relativePath.slice(0, slashIndex + 1);
      folderSet.add(folderPrefix);
    }
  });

  // Process delete markers for deleted files
  versionsResponse.DeleteMarkers?.forEach((marker) => {
    if (!marker.Key || !marker.IsLatest) return;
    if (marker.Key === prefix) return;

    const relativePath = marker.Key.slice(prefixLen);
    const slashIndex = relativePath.indexOf('/');

    if (slashIndex === -1) {
      // Direct deleted file
      if (!fileMap.has(marker.Key)) {
        const previousVersion = versionsByKey.get(marker.Key);
        fileMap.set(marker.Key, {
          size: previousVersion?.size ?? 0,
          lastModified: marker.LastModified ?? new Date(),
          etag: previousVersion?.etag,
          isDeleted: true,
        });
      }
    } else {
      // Deleted item in subfolder - still show the folder
      const folderPrefix = (prefix ?? '') + relativePath.slice(0, slashIndex + 1);
      folderSet.add(folderPrefix);
    }
  });

  // Convert to arrays
  const objects: S3Object[] = Array.from(fileMap.entries()).map(([key, info]) => ({
    key,
    size: info.size,
    lastModified: info.lastModified,
    etag: info.etag,
    isFolder: false,
    isDeleted: info.isDeleted,
  }));

  const prefixes = Array.from(folderSet);
  const folders: S3Object[] = prefixes.map((p) => ({
    key: p,
    size: 0,
    lastModified: new Date(),
    isFolder: true,
    isDeleted: false,
  }));

  return {
    objects: [...folders, ...objects],
    prefixes,
    isTruncated: versionsResponse.IsTruncated ?? false,
    continuationToken: versionsResponse.NextKeyMarker,
  };
}

export async function deleteObject(client: S3Client, bucket: string, key: string): Promise<void> {
  // If it's a folder, check if it's empty first
  if (key.endsWith('/')) {
    const contents = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: key,
        MaxKeys: 2, // We only need to know if there's more than the folder itself
      })
    );

    // Check if there are any objects inside (excluding the folder placeholder itself)
    const hasContents = contents.Contents?.some((obj) => obj.Key !== key);
    if (hasContents) {
      throw new FolderNotEmptyError();
    }
  }

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

export async function getObjectAcl(
  client: S3Client,
  bucket: string,
  key: string
): Promise<S3ObjectAcl> {
  const response = await client.send(
    new GetObjectAclCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  // Determine if public based on grants
  const isPublic = response.Grants?.some(
    (grant) =>
      grant.Grantee?.URI === 'http://acs.amazonaws.com/groups/global/AllUsers' ||
      grant.Grantee?.URI === 'http://acs.amazonaws.com/groups/global/AuthenticatedUsers'
  );

  return {
    owner: response.Owner?.DisplayName ?? response.Owner?.ID ?? 'unknown',
    isPublic: isPublic ?? false,
    grants:
      response.Grants?.map((grant) => ({
        grantee: grant.Grantee?.DisplayName ?? grant.Grantee?.URI ?? grant.Grantee?.ID ?? 'unknown',
        permission: grant.Permission ?? 'UNKNOWN',
      })) ?? [],
  };
}

export async function setObjectAcl(
  client: S3Client,
  bucket: string,
  key: string,
  acl: ObjectCannedACL
): Promise<void> {
  await client.send(
    new PutObjectAclCommand({
      Bucket: bucket,
      Key: key,
      ACL: acl,
    })
  );
}
