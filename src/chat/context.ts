export type Chat = {
    role: "system" | "user" | "assistant",
    content: "string"
}

export class Context {
    constructor(
        public system: Chat,
        public memory: string,
        public chats: Chat[]
    ) { }
}