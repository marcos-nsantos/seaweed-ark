import type { SeaweedIAMConfig, SeaweedIdentity } from './client';
import { readIdentityConfig, writeIdentityConfig } from './client';
import type { IAMUser, IAMAction, CreateUserResponse } from '@/types/iam';

function generateAccessKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'AK';
  for (let i = 0; i < 18; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateSecretKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Convert SeaweedFS actions format to our IAMAction format
// SeaweedFS uses: "Read", "Write", "List", "Tagging", "Admin"
// Or with bucket: "Read:bucketname", "Write:bucketname"
function parseSeaweedActions(actions: string[]): Array<{ bucket: string; actions: IAMAction[] }> {
  const bucketActions = new Map<string, IAMAction[]>();

  for (const action of actions) {
    if (action.includes(':')) {
      const [actionType, bucket] = action.split(':');
      const existing = bucketActions.get(bucket) || [];
      if (!existing.includes(actionType as IAMAction)) {
        existing.push(actionType as IAMAction);
      }
      bucketActions.set(bucket, existing);
    } else {
      // Global action (applies to all buckets)
      const existing = bucketActions.get('*') || [];
      if (!existing.includes(action as IAMAction)) {
        existing.push(action as IAMAction);
      }
      bucketActions.set('*', existing);
    }
  }

  return Array.from(bucketActions.entries()).map(([bucket, acts]) => ({
    bucket,
    actions: acts,
  }));
}

// Convert our permission format to SeaweedFS actions
function toSeaweedActions(permissions: Array<{ bucket: string; actions: IAMAction[] }>): string[] {
  const actions: string[] = [];

  for (const perm of permissions) {
    for (const action of perm.actions) {
      if (perm.bucket === '*') {
        actions.push(action);
      } else {
        actions.push(`${action}:${perm.bucket}`);
      }
    }
  }

  return actions;
}

// Convert SeaweedFS identity to our IAMUser format
function identityToUser(identity: SeaweedIdentity): IAMUser {
  return {
    userId: identity.name, // Using name as ID since SeaweedFS doesn't have separate IDs
    userName: identity.name,
    accessKeyId: identity.credentials[0]?.accessKey || '',
    createdAt: new Date(), // SeaweedFS doesn't store creation date
    permissions: parseSeaweedActions(identity.actions),
  };
}

export async function listUsers(config: SeaweedIAMConfig): Promise<IAMUser[]> {
  const identityConfig = await readIdentityConfig(config);
  return identityConfig.identities.map(identityToUser);
}

export async function createUser(
  config: SeaweedIAMConfig,
  userName: string
): Promise<CreateUserResponse> {
  const identityConfig = await readIdentityConfig(config);

  // Check if user already exists
  if (identityConfig.identities.some((i) => i.name === userName)) {
    throw new Error('User already exists');
  }

  const accessKey = generateAccessKey();
  const secretKey = generateSecretKey();

  const newIdentity: SeaweedIdentity = {
    name: userName,
    credentials: [
      {
        accessKey,
        secretKey,
      },
    ],
    actions: [], // Start with no permissions
  };

  identityConfig.identities.push(newIdentity);
  await writeIdentityConfig(config, identityConfig);

  return {
    userId: userName,
    userName,
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  };
}

export async function deleteUser(config: SeaweedIAMConfig, userId: string): Promise<void> {
  const identityConfig = await readIdentityConfig(config);

  const index = identityConfig.identities.findIndex((i) => i.name === userId);
  if (index === -1) {
    throw new Error('User not found');
  }

  identityConfig.identities.splice(index, 1);
  await writeIdentityConfig(config, identityConfig);
}

export async function regenerateCredentials(
  config: SeaweedIAMConfig,
  userId: string
): Promise<{ accessKeyId: string; secretAccessKey: string }> {
  const identityConfig = await readIdentityConfig(config);

  const identity = identityConfig.identities.find((i) => i.name === userId);
  if (!identity) {
    throw new Error('User not found');
  }

  const accessKey = generateAccessKey();
  const secretKey = generateSecretKey();

  identity.credentials = [{ accessKey, secretKey }];
  await writeIdentityConfig(config, identityConfig);

  return {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  };
}

export async function updateUserPermissions(
  config: SeaweedIAMConfig,
  userId: string,
  permissions: Array<{ bucket: string; actions: IAMAction[] }>
): Promise<void> {
  const identityConfig = await readIdentityConfig(config);

  const identity = identityConfig.identities.find((i) => i.name === userId);
  if (!identity) {
    throw new Error('User not found');
  }

  identity.actions = toSeaweedActions(permissions);
  await writeIdentityConfig(config, identityConfig);
}
