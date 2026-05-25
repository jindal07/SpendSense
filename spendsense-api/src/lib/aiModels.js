/** Model tiers — pick the cheapest model that satisfies the capability. */
export const MODELS = {
  LITE: 'gemini-2.0-flash-lite',
  FLASH: 'gemini-2.0-flash',
  PRO: 'gemini-2.0-flash',
};

export const FEATURE_MODEL = {
  'suggest-category': MODELS.LITE,
  'parse-expense': MODELS.LITE,
  'parse-expense-audio': MODELS.FLASH,
  'scan-receipt': MODELS.FLASH,
  chat: MODELS.FLASH,
};
