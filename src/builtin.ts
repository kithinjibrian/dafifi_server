import { builtin } from '@kithinji/tlugha'
import { readFile } from "fs/promises";
import * as v8 from "v8";


export function builtin_init() {
    const totalHeapSize = v8.getHeapStatistics().total_available_size;
    let totalHeapSizeinGB = (totalHeapSize / 1024 / 1024 / 1024).toFixed(2);
    console.log(`Total heap size: ${totalHeapSizeinGB} GB`);

    builtin["__google_auth__"] = {
        type: "function",
        signature: "<T, U>(args: T) -> U",
        exec: (args: any[]) => {
            console.log(args)
        }
    }
}