'use strict';

const {
  createDataSource,
  createTypeOrmDataSourceOptions,
  destroyDataSource,
  persistenceEntities,
  persistenceMigrations,
  runMigrations,
} = require('@verdiron/persistence');

function readRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main() {
  const dataSource = await createDataSource(
    createTypeOrmDataSourceOptions({
      env: {
        POSTGRES_HOST: readRequiredEnv('POSTGRES_HOST'),
        POSTGRES_PORT: Number(process.env.POSTGRES_PORT ?? 5432),
        POSTGRES_USER: readRequiredEnv('POSTGRES_USER'),
        POSTGRES_PASSWORD: readRequiredEnv('POSTGRES_PASSWORD'),
        POSTGRES_DB: readRequiredEnv('POSTGRES_DB'),
      },
      entities: persistenceEntities,
      migrations: persistenceMigrations,
    }),
  );

  try {
    await runMigrations(dataSource);
    console.log(
      JSON.stringify({
        service: 'db-migrate',
        msg: 'migrations complete',
      }),
    );
  } finally {
    await destroyDataSource(dataSource);
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      service: 'db-migrate',
      msg: 'migration failed',
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
});
