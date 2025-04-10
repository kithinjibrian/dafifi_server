export class Db {
    private db: Record<string, any> = {};
    private static instance: Db;

    private constructor() {
        console.log("Database connection established.");
    }

    public static get_instance(): Db {
        if (!Db.instance) {
            Db.instance = new Db();
        }
        return Db.instance;
    }

    public set<T>(key: string, value: T): void {
        this.db[key] = value;
    }

    public get<T>(key: string): T | undefined {
        return this.db[key];
    }

    public delete(key: string) {
        delete this.db[key];
    }
}
