import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  referenceAssetIds,
  referenceAssets,
  referenceSiteIds,
  referenceSites,
} from '../seeds/reference-data.seed';

export class SeedReferenceData1740000000003 implements MigrationInterface {
  name = 'SeedReferenceData1740000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const site of referenceSites) {
      await queryRunner.query(
        `INSERT INTO sites (site_id, name, region)
         VALUES ($1, $2, $3)
         ON CONFLICT (site_id) DO NOTHING`,
        [site.siteId, site.name, site.region],
      );
    }

    for (const asset of referenceAssets) {
      await queryRunner.query(
        `INSERT INTO assets (
           asset_id, name, asset_type, asset_class, site_id, fuel_type, rated_power_kw
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (asset_id) DO NOTHING`,
        [
          asset.assetId,
          asset.name,
          asset.assetType,
          asset.assetClass,
          asset.siteId,
          asset.fuelType,
          asset.ratedPowerKw,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM assets WHERE asset_id = ANY($1::varchar[])`,
      [referenceAssetIds],
    );
    await queryRunner.query(
      `DELETE FROM sites WHERE site_id = ANY($1::varchar[])`,
      [referenceSiteIds],
    );
  }
}
