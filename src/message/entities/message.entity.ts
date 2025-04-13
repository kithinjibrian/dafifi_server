import { Chat } from 'src/chat/entities/chat.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn
} from 'typeorm';

@Entity('message')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ default: 'user' })
    sender: 'user' | 'assistant' | 'tool';

    @Column({ default: false })
    rendered: boolean;

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
