import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';

import { Edge, NodeID, Node } from '../memory.class';

@Entity()
export class Memory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'json' })
    memory: {
        nodes: Record<NodeID, Node>;
        edges: Edge[];
    }
}
