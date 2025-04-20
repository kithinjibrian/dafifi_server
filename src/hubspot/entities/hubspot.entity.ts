import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('hubspot_tokens')
export class HubspotToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    username: string;

    @Column({ type: 'text' })
    refresh_token: string;

    @Column({ type: 'text' })
    access_token: string;

    @Column({ nullable: true, type: 'timestamp' })
    expiry_date: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}