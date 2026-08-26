// Variable resolution engine
// Resolves {{VARIABLE_NAME}} patterns from active environment

const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

export interface ResolutionResult {
  resolved: string;
  unresolvedVars: string[];
  resolvedVars: string[];
}

// Resolve variables in a string
export function resolveVariables(
  input: string,
  variables: Record<string, string>
): ResolutionResult {
  const unresolvedVars: string[] = [];
  const resolvedVars: string[] = [];

  const resolved = input.replace(VARIABLE_PATTERN, (match, varName: string) => {
    const trimmed = varName.trim();
    if (trimmed in variables) {
      resolvedVars.push(trimmed);
      return variables[trimmed];
    }
    unresolvedVars.push(trimmed);
    return match; // Keep unresolved as-is
  });

  return { resolved, unresolvedVars, resolvedVars };
}

// Extract variable names from a string (without resolving)
export function extractVariables(input: string): string[] {
  const vars: string[] = [];
  let match;
  const pattern = new RegExp(VARIABLE_PATTERN);
  while ((match = pattern.exec(input)) !== null) {
    vars.push(match[1].trim());
  }
  return vars;
}

// Check if a string contains any variable references
export function hasVariables(input: string): boolean {
  return VARIABLE_PATTERN.test(input);
}

// Build a flat variable map from environment variables
export function buildVariableMap(
  variables: Array<{ key: string; value: string; enabled: boolean }>
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const v of variables) {
    if (v.enabled && v.key) {
      map[v.key] = v.value;
    }
  }
  return map;
}
