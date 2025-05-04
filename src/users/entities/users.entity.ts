import { Chat } from "src/chat/entities/chat.entity";
import { Memory } from "src/memory/entities/memory.entity";
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn
} from "typeorm";

@Entity('user')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    username: string;

    @Column()
    password: string;

    @Column()
    email: string;

    @OneToMany(() => Chat, chat => chat.user)
    chats: Chat[]

    @OneToOne(() => Memory, { cascade: true })
    @JoinColumn()
    memory: Memory;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}