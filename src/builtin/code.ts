import { LRUCache } from "./lru"

export class Code<K, V> extends LRUCache<K, V> {
  private static instance: Code<any, any>;

  private constructor(capacity: number) {
    super(capacity);
  }

  static get_instance<T, U>(capacity: number): Code<T, U> {
    if (!Code.instance) {
      Code.instance = new Code<T, U>(capacity);
    }
    return Code.instance;
  }
}
