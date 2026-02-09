import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('apocalypses')
export class Apocalypse {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'hazard_level', length: 50 })
  hazardLevel!: string;

  @Column({ length: 50 })
  duration!: string;
}
