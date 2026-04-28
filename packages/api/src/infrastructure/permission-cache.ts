import { PermissionCache } from '@vegabase/service';

export const permissionCache = new PermissionCache(async (_roleId) => [
  'MDY_ENTRY:VIEW',
  'MDY_ENTRY:ADD',
  'MDY_ENTRY:UPDATE',
  'MDY_ENTRY:DELETE',
  'MDY_CLUSTER:VIEW',
  'MDY_CLUSTER:DELETE',
]);
