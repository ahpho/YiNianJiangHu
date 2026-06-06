import type { ZodSchema } from 'zod';

export interface ValidationResult {
  success: boolean;
  errors: string[];
}

export function validateData<T>(
  schema: ZodSchema<T>,
  data: unknown,
  filename: string,
): ValidationResult {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, errors: [] };
  return {
    success: false,
    errors: result.error.issues.map(
      (issue) => `${filename}: ${issue.path.join('.') || 'root'} - ${issue.message}`,
    ),
  };
}

export function validateAll<T>(
  schema: ZodSchema<T>,
  files: Array<{ filename: string; data: unknown }>,
): ValidationResult {
  const allErrors: string[] = [];
  for (const file of files) {
    const result = validateData(schema, file.data, file.filename);
    if (!result.success) allErrors.push(...result.errors);
  }
  return allErrors.length > 0
    ? { success: false, errors: allErrors }
    : { success: true, errors: [] };
}
