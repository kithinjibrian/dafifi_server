import { Chat } from 'src/chat/entities/chat.entity';
import {
    Entity,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('task')
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ default: 'stopped' })
    state: 'stopped' | 'running' | 'crashed';

    @Column({ default: 'cron' })
    type: 'cron' | 'http';

    @Column({ default: "" })
    nickname: string;

    @Column('text')
    explainer: string;

    @Column({ nullable: false })
    filename: string;

    @Column({ nullable: false })
    username: string;

    @Column({ type: 'json' })
    data: any;

    @ManyToOne(() => Chat, (chat) => chat.tasks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'chatId' })
    chat: Chat;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}