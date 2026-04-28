export const ScreenCodes = {
  MDY_ENTRY:   'MDY_ENTRY',
  MDY_CLUSTER: 'MDY_CLUSTER',
} as const;

export type ScreenCode = typeof ScreenCodes[keyof typeof ScreenCodes];
