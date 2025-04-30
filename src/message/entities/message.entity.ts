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

@Entity('message')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ default: 'user' })
    sender: 'system' | 'user' | 'assistant' | 'tool';

    @Column('text')
    message: string;

    @Column({ default: 0 })
    tokens: number;

    @ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'chatId' })
    chat: Chat;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
