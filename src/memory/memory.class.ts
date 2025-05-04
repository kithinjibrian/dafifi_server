export type NodeID = string;

export interface Node {
    id: NodeID;
    type: string;
    properties: Record<string, any>;
    context: string[];
    weight?: number;
    createdOn?: string;
    lastUpdated?: string;
}

export interface Edge {
    subject: NodeID;
    predicate: string;
    object: NodeID;
    context: string[];
    weight?: number;
    addedOn?: string;
    lastUsed?: string;
}

export class MemoryGraph {
    private nodes: Map<NodeID, Node> = new Map();
    private edges: Edge[] = [];

    addNode(
        id: NodeID,
        type: string = "Entity",
        properties: Record<string, any> = {},
        context: string = ""
    ): void {
        const now = new Date().toISOString();

        if (!this.nodes.has(id)) {
            this.nodes.set(id, {
                id,
                type,
                properties,
                weight: 1,
                context:[
                    context
                ],
                createdOn: now,
                lastUpdated: now
            });
        } else {
            const existing = this.nodes.get(id)!;
            Object.assign(existing.properties, properties);
            existing.lastUpdated = now;
        }
    }

    addEdge(
        subject: NodeID,
        predicate: string,
        object: NodeID,
        context: string = ""
    ): void {
        if (!this.nodes.has(subject)) {
            throw new Error(`Subject node (${subject}) does not exist. You must add it using addNode() before linking it with an edge.`);
        }

        if (!this.nodes.has(object)) {
            throw new Error(`Object node (${object}) does not exist. You must add it using addNode() before linking it with an edge.`);
        }

        const now = new Date().toISOString();

        this.edges.push({
            subject,
            predicate,
            object,
            weight: 1,
            context:[
                context
            ],
            addedOn: now,
            lastUsed: now
        });
    }

    updateEdgeUsage(subject: NodeID, predicate: string, object: NodeID): void {
        const edge = this.edges.find(
            e => e.subject === subject && e.predicate === predicate && e.object === object
        );
        if (edge) {
            edge.lastUsed = new Date().toISOString();
            edge.weight = Math.min((edge.weight || 0.5) + 0.2, 1.0);
        }
    }

    decayEdgeWeights(decayRate: number = 0.1): void {
        const now = Date.now();
        this.edges.forEach(edge => {
            const lastUsed = edge.lastUsed ? new Date(edge.lastUsed).getTime() : now;
            const daysSinceUse = (now - lastUsed) / (1000 * 60 * 60 * 24);
            const decayFactor = Math.exp(-decayRate * daysSinceUse);
            edge.weight = Math.max((edge.weight || 1.0) * decayFactor, 0);
        });

        this.edges = this.edges.filter(e => (e.weight || 0) > 0.05);
    }

    normalizeEdgesFrom(subject: NodeID): void {
        const outgoing = this.edges.filter(e => e.subject === subject);
        const total = outgoing.reduce((sum, e) => sum + (e.weight || 0), 0);
        if (total > 0) {
            outgoing.forEach(e => {
                e.weight = (e.weight || 0) / total;
            });
        }
    }

    getTopRelations(subject: NodeID, limit: number = 5): Edge[] {
        return this.edges
            .filter(e => e.subject === subject)
            .sort((a, b) => (b.weight || 0) - (a.weight || 0))
            .slice(0, limit);
    }

    getNode(id: NodeID): Node | undefined {
        return this.nodes.get(id);
    }

    getEdgesByNode(id: NodeID): Edge[] {
        return this.edges.filter(e => e.subject === id || e.object === id);
    }

    findRelations(subject: NodeID, predicate?: string): Edge[] {
        return this.edges.filter(
            e => e.subject === subject && (!predicate || e.predicate === predicate)
        );
    }

    static fromFullJSON(data: {
        nodes: Record<NodeID, Node>;
        edges: Edge[];
    }): MemoryGraph {
        const graph = new MemoryGraph();
        for (const [id, nodeData] of Object.entries(data.nodes)) {
            graph.nodes.set(id, { ...nodeData });
        }
        graph.edges = data.edges.map(edge => ({ ...edge }));
        return graph;
    }

    toFullJSON(): object {
        return {
            nodes: Object.fromEntries(
                [...this.nodes.entries()].map(([id, node]) => [id, { ...node }])
            ),
            edges: this.edges.map(edge => ({ ...edge }))
        };
    }
}
