import type { OpenAPIObject } from '@nestjs/swagger';
import { z } from 'zod';
import {
  assetDetailSchema,
  assetMetricsUnitsSchema,
  fleetMetricsBucketGranularitySchema,
  fleetMetricsSchema,
  fleetMetricsUnitsSchema,
  idlingReportSchema,
  idlingReportUnitsSchema,
} from '@verdiron/domain';
import { zodToJsonSchema } from 'zod-to-json-schema';

const jsonSchemaOptions = {
  target: 'openApi3' as const,
  $refStrategy: 'none' as const,
};

const fleetMetricsResponseSchema = z.object({
  data: fleetMetricsSchema,
  meta: z.object({
    units: fleetMetricsUnitsSchema,
    bucket: fleetMetricsBucketGranularitySchema,
    from: z.string().datetime(),
    to: z.string().datetime(),
    siteId: z.string().min(1).optional(),
    bucketCount: z.number().int().nonnegative(),
    cacheVersion: z.number().int(),
  }),
});

const assetMetricsResponseSchema = z.object({
  data: assetDetailSchema,
  meta: z.object({
    units: assetMetricsUnitsSchema,
    from: z.string().datetime(),
    to: z.string().datetime(),
    assetId: z.string().min(1),
    recentTelemetryCount: z.number().int().nonnegative(),
    recentTelemetryLimit: z.number().int().positive(),
    cacheVersion: z.number().int(),
  }),
});

const idlingReportResponseSchema = z.object({
  data: idlingReportSchema,
  meta: z.object({
    units: idlingReportUnitsSchema,
    from: z.string().datetime(),
    to: z.string().datetime(),
    siteId: z.string().min(1).optional(),
    limit: z.number().int().positive(),
    entryCount: z.number().int().nonnegative(),
    cacheVersion: z.number().int(),
  }),
});

const healthOkSchema = z.object({
  status: z.literal('ok'),
});

const apiMetaResponseSchema = z.object({
  service: z.string(),
  version: z.string(),
});

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

function setJsonResponseSchema(
  document: OpenAPIObject,
  path: string,
  method: HttpMethod,
  status: string,
  schema: z.ZodType,
): void {
  const pathItem = document.paths[path];
  if (!pathItem?.[method]) {
    throw new Error(`OpenAPI path missing: ${method.toUpperCase()} ${path}`);
  }

  const operation = pathItem[method]!;
  operation.responses ??= {};
  operation.responses[status] ??= { description: 'Response body' };
  operation.responses[status].content = {
    'application/json': {
      schema: zodToJsonSchema(schema, jsonSchemaOptions),
    },
  };
}

/** Adds response schemas that Nest Swagger decorators omit today. */
export function enrichOpenApiDocument(document: OpenAPIObject): OpenAPIObject {
  setJsonResponseSchema(
    document,
    '/health/live',
    'get',
    '200',
    healthOkSchema,
  );
  setJsonResponseSchema(
    document,
    '/api/v1/meta',
    'get',
    '200',
    apiMetaResponseSchema,
  );
  setJsonResponseSchema(
    document,
    '/api/v1/fleet/metrics',
    'get',
    '200',
    fleetMetricsResponseSchema,
  );
  setJsonResponseSchema(
    document,
    '/api/v1/assets/{assetId}/metrics',
    'get',
    '200',
    assetMetricsResponseSchema,
  );
  setJsonResponseSchema(
    document,
    '/api/v1/reports/idling',
    'get',
    '200',
    idlingReportResponseSchema,
  );

  return document;
}
