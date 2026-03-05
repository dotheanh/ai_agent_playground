import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class VisitorStats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('bigint', { default: 0 })
  pageViews: number;

  @Column('bigint', { default: 0 })
  uniqueVisitors: number;

  @Column('simple-json', { default: '{}' })
  onlineSessions: Record<string, number>;

  @UpdateDateColumn()
  lastUpdated: Date;
}
