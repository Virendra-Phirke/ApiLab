// Environment with typed variables
export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
  createdAt: number;
  updatedAt: number;
}

// Individual variable
export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  type: 'public' | 'secret';
  enabled: boolean;
}

// Default environment constructor
export const createDefaultEnvironment = (name: string): Environment => ({
  id: crypto.randomUUID(),
  name,
  variables: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Default variable constructor
export const createDefaultVariable = (): EnvironmentVariable => ({
  id: crypto.randomUUID(),
  key: '',
  value: '',
  type: 'public',
  enabled: true,
});
