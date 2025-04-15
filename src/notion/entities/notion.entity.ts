// notion-token.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('notion_tokens')
export class NotionToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    username: string;

    @Column({ type: 'text' })
    access_token: string;

    @Column({ nullable: true })
    workspace_id: string;

    @Column({ nullable: true })
    workspace_name: string;

    @Column({ nullable: true })
    bot_id: string;

    @Column({ default: true })
    is_active: boolean;

    @Column({ nullable: true, type: 'timestamp' })
    expiry_date: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}