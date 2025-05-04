class Node<K, V> {
  key: K;
  value: V;
  prev: Node<K, V> | null = null;
  next: Node<K, V> | null = null;

  constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
  }
}

export class LRUCache<K, V> {
  private capacity: number;
  private map: Map<K, Node<K, V>>;
  private head: Node<K, V>;
  private tail: Node<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.map = new Map();

    // Dummy head and tail
    this.head = new Node<K, V>(null as any, null as any);
    this.tail = new Node<K, V>(null as any, null as any);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;

    this.move_to_head(node);
    return node.value;
  }

  put(key: K, value: V): void {
    const node = this.map.get(key);

    if (node) {
      node.value = value;
      this.move_to_head(node);
    } else {
      const newNode = new Node(key, value);
      this.map.set(key, newNode);
      this.add_to_head(newNode);

      if (this.map.size > this.capacity) {
        const tail = this.remove_tail();
        if (tail) this.map.delete(tail.key);
      }
    }
  }

  private add_to_head(node: Node<K, V>): void {
    node.prev = this.head;
    node.next = this.head.next;

    if (this.head.next) this.head.next.prev = node;
    this.head.next = node;
  }

  private remove_node(node: Node<K, V>): void {
    const prev = node.prev;
    const next = node.next;

    if (prev) prev.next = next;
    if (next) next.prev = prev;
  }

  private move_to_head(node: Node<K, V>): void {
    this.remove_node(node);
    this.add_to_head(node);
  }

  private remove_tail(): Node<K, V> | null {
    const node = this.tail.prev;
    if (!node || node === this.head) return null;

    this.remove_node(node);
    return node;
  }
}
