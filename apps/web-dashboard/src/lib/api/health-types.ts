export type DependencyStatus = 'ok' | 'error';

export interface ReadinessChecks {
  postgres: DependencyStatus;
  rabbitmq: DependencyStatus;
  dynamodb: DependencyStatus;
}

export interface ReadinessResult {
  status: DependencyStatus;
  checks: ReadinessChecks;
}
