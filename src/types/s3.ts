export type S3Object = {
  key: string;
  size: number;
  lastModified: Date;
  etag?: string;
  isFolder: boolean;
};

export type S3Bucket = {
  name: string;
  creationDate?: Date;
};

export type S3ListObjectsResponse = {
  objects: S3Object[];
  prefixes: string[];
  isTruncated: boolean;
  continuationToken?: string;
};

export type S3UploadProgress = {
  id: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
};

export type S3ObjectVersion = {
  key: string;
  versionId: string;
  isLatest: boolean;
  lastModified: Date;
  size: number;
  etag?: string;
  isDeleteMarker: boolean;
};

export type S3ObjectAcl = {
  owner: string;
  isPublic: boolean;
  grants: {
    grantee: string;
    permission: string;
  }[];
};

export type S3CannedAcl = 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
