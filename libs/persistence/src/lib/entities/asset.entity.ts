import type { FuelType } from '@verdiron/domain';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { BaseEntity } from '../base.entity';
import { SiteEntity } from './site.entity';

@Entity('assets')
export class AssetEntity extends BaseEntity {
  @Column({ name: 'asset_id', type: 'varchar', length: 64, unique: true })
  assetId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'asset_type', type: 'varchar', length: 128 })
  assetType!: string;

  @Column({ name: 'asset_class', type: 'varchar', length: 128 })
  assetClass!: string;

  @ManyToOne(() => SiteEntity, (site) => site.assets, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'site_id', referencedColumnName: 'siteId' })
  site!: SiteEntity;

  @RelationId((asset: AssetEntity) => asset.site)
  siteId!: string;

  @Column({ name: 'fuel_type', type: 'varchar', length: 32 })
  fuelType!: FuelType;

  @Column({
    name: 'rated_power_kw',
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  ratedPowerKw!: number;
}
