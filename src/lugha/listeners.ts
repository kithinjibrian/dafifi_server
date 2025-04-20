import {
    ASTNode,
    ASTVisitor,
    Extension,
    FunctionDecNode,
    builtin,
    Module
} from "@kithinji/tlugha";

import { nanoid } from 'nanoid';

let listeners: Record<string, any> = {};

export class Listeners extends Extension<ASTVisitor> {
    public name = "listeners";

    async before_accept(node: ASTNode) { }

    async after_main({ root }: { root: Module }) {
        if (!("__username__" in builtin) ||
            !("__chat_id__" in builtin)
        ) {
            return;
        }

        if (
            builtin.__username__.type !== "variable" ||
            builtin.__chat_id__.type !== "variable"
        ) {
            return;
        }

        let __http_listen__ = root.frame.get("__http_listen__");

        if (!__http_listen__ || !(__http_listen__ instanceof FunctionDecNode)) {
            return;
        }

        let username = builtin.__username__.value,
            chat_id = builtin.__chat_id__.value;

        let id = nanoid(5);

        listeners[id] = {
            username,
            chat_id,
            function: __http_listen__
        }

        return {
            from: "http listener module",
            entry: `https://api.dafifi.net/hl/${id}`
        }
    }

    async after_accept(node: ASTNode) { }

    async handle_node(node: ASTNode) { }

    before_run() {
        return []
    }
}