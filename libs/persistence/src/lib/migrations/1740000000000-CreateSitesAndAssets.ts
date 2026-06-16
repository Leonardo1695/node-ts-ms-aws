import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateSitesAndAssets1740000000000 implements MigrationInterface {
  name = 'CreateSitesAndAssets1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sites',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'site_id',
            type: 'varchar',
            length: '64',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'region',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'assets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'asset_id',
            type: 'varchar',
            length: '64',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'asset_type',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'asset_class',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'site_id',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'fuel_type',
            type: 'varchar',
            length: '32',
            isNullable: false,
          },
          {
            name: 'rated_power_kw',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_assets_site_id_sites_site_id',
            columnNames: ['site_id'],
            referencedTableName: 'sites',
            referencedColumnNames: ['site_id'],
            onDelete: 'RESTRICT',
          }),
        ],
        indices: [
          new TableIndex({
            name: 'IDX_assets_site_id',
            columnNames: ['site_id'],
          }),
        ],
      }),
      true,
    );

    await queryRunner.query(`
      ALTER TABLE assets
      ADD CONSTRAINT chk_assets_fuel_type
      CHECK (fuel_type IN ('diesel', 'gasoline'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('assets', true, true, true);
    await queryRunner.dropTable('sites', true, true, true);
  }
}
