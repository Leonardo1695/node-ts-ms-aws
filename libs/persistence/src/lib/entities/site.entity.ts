import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../base.entity';
import type { AssetEntity } from './asset.entity';

@Entity('sites')
export class SiteEntity extends BaseEntity {
  @Column({ name: 'site_id', type: 'varchar', length: 64, unique: true })
  siteId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 128 })
  region!: string;

  @OneToMany('AssetEntity', (asset: AssetEntity) => asset.site)
  assets!: AssetEntity[];
}
