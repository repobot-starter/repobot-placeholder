import DataLoader from "dataloader"
import { RpcError } from "./RpcError.js"

/**
 * Batch loaders return either the value or an RpcError in each position.
 * DataLoader treats Error instances in batch results as per-key rejections,
 * so `loader.load(id)` rejects with the RpcError for missing rows.
 */
export type ValueOrError<T> = T | RpcError
export type BatchLoadFunction<V> = (ids: readonly string[]) => Promise<ValueOrError<V>[]>

/**
 * Creates a DataLoader over a service's orderedBatchLoad*ByIds method. Field
 * resolvers hydrate relations through these loaders so that resolving N rows
 * issues one batched query instead of N.
 */
export function orderedBatchLoad<V>(batchLoad: BatchLoadFunction<V>): DataLoader<string, V> {
    return new DataLoader<string, V>(
        // DataLoader's types want (V | Error)[]; ValueOrError satisfies that.
        async (ids) => (await batchLoad(ids)) as (V | Error)[],
    )
}
