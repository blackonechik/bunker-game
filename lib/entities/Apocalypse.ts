import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('apocalypses')
export class Apocalypse {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ length: 2048, nullable: true })
  image!: string;
}
