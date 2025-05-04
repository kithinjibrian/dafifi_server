import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('linkedin_tokens')
export class LinkedinToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    username: string;

    @Column({ type: 'text' })
    access_token: string;

    @Column({ type: 'text' })
    scope: string;

    @Column()
    sub: string;

    @Column({ type: 'text' })
    email: string;

    @Column({ default: false })
    email_verified: boolean;

    @Column({ type: 'text' })
    name: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}