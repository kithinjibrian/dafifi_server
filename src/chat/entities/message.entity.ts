import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn
} from 'typeorm';
import { Chat } from './chat.entity';

@Entity('message')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ default: 'user' })
    sender: 'user' | 'assistant' | 'tool';

    @Column('text')
    message: string;

    @Column('text', { nullable: true })
    time?: string;

    @ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'chatId' })
    chat: Chat;

    @CreateDateColumn()
    createdAt: Date;
}
