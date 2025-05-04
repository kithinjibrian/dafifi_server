import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";

import { User } from "src/users/entities/users.entity";
import { Message } from "src/message/entities/message.entity";
import { Task } from "src/task/entities/task.entity";

@Entity('chat')
export class Chat {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ default: false })
    starred: boolean;

    @Column({ default: false })
    deleted: boolean;

    @OneToMany(() => Task, (task) => task.chat, { cascade: true })
    tasks: Task[];

    @OneToMany(() => Message, (message) => message.chat, { cascade: true })
    messages: Message[];

    @ManyToOne(() => User, user => user.chats)
    user: User

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
