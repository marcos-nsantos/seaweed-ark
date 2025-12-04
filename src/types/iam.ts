export type IAMUser = {
  userId: string;
  userName: string;
  accessKeyId: string;
  createdAt: Date;
  permissions: IAMPermission[];
};

export type IAMPermission = {
  bucket: string;
  actions: IAMAction[];
};

export type IAMAction = 'Admin' | 'Read' | 'Write' | 'List' | 'Tagging';

export type CreateUserRequest = {
  userName: string;
  permissions?: IAMPermission[];
};

export type CreateUserResponse = {
  userId: string;
  userName: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export type RegenerateCredentialsResponse = {
  accessKeyId: string;
  secretAccessKey: string;
};
