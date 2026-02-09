import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column()
  capacity!: number;

  @Column({ type: 'simple-json' })
  supplies!: string[];

  @Column({ length: 50 })
  condition!: string;

  @Column({ type: 'text' })
  description!: string;
}
