import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('google_tokens')
export class GToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    username: string;

    @Column()
    email: string;

    @Column({ type: 'text' })
    access_token: string;

    @Column({ type: 'text' })
    refresh_token: string;

    @Column({ type: 'text', nullable: true })
    scope: string;

    @Column({ nullable: true })
    token_type: string;

    @Column({ type: 'bigint', nullable: true })
    expiry_date: number; // In ms since epoch

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

