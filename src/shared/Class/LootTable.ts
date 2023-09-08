import { LootTable, ILootTableEntry } from "../types";

export declare type LootTableResolver<
    T extends string = string, // Item Id type
    V extends string = string // Loot Table Id type
> = (id: V) => LootTable<T> | undefined;

export declare type LootTableResolverAsync<T extends string = string, V extends string = string> = (id: V) => Promise<LootTable<T> | undefined>;

export interface ILootItem<T extends string = string> {
    id: T | null;
    quantity: number;
}

export type Loot<T extends string = string> = Array<ILootItem<T>>;

export function AddLoot<TID extends string = string>(loot: Loot<TID>, item: ILootItem<TID>): Loot<TID> {
    const i = loot.findIndex((e) => e.id == item.id);
    if (i >= 0) loot[i].quantity += item.quantity;
    else loot.push({ id: item.id, quantity: item.quantity });
    return loot;
}

function MergeLoot<TID extends string = string>(a: Loot<TID>, b: Loot<TID>): Loot<TID> {
    b.forEach((e) => AddLoot(a, e));
    return a;
}

function CloneEntry<T extends string = string>(entry: Partial<ILootTableEntry<T>>): Partial<ILootTableEntry<T>> {
    return JSON.parse(JSON.stringify(entry)) as Partial<ILootTableEntry<T>>;
}

function CloneLootTable<T extends string = string>(table: LootTable<T>): LootTable<T> {
    const result = JSON.parse(JSON.stringify(table)) as LootTable<T>;
    return result;
}

function isPositiveInt(value: number): boolean {
    return value >= 0 && value === Math.floor(value);
}

const rxLootTableEntryID = new RegExp("^@?([a-z0-9_-]+)(\\(([0-9]+)\\))?$", "i");

export function ParseLootID<T extends string = string>(id: string): { id: T | null; count: number } {
    let count = 0;
    let name: T | null = null;
    const matches = id.match(rxLootTableEntryID);
    if (matches) {
        name = matches[1] as T;
        count = matches[3] === undefined ? 1 : parseInt(matches[3]);
    }
    return { id: name, count };
}

export function LootTableEntry<T extends string = string>(
    id: T | null,
    weight: number = 1,
    min: number = 1,
    max: number = 1,
    step: number = 1,
    group: number = 1
): ILootTableEntry {
    if (id !== null && !rxLootTableEntryID.test(id)) throw Error(`LootTableEntry ${id} invalid id format.`);
    // if (!isPositiveInt(min) || !isPositiveInt(max))
    //   throw Error(
    //     `LootTableEntry ${id} min and max must both be non-negative integers.`
    //   )
    if (min > max) throw Error(`LootTableEntry ${id} min must be less than or equal to max.`);
    if ((!isPositiveInt(step) || step == 0) && !Number.isNaN(step)) throw Error(`LootTableEntry ${id} step must be a positive integer or NaN.`);
    if (!isPositiveInt(group)) throw Error(`LootTableEntry ${id} group must be a non-negative integer.`);
    if (!isPositiveInt(weight)) throw Error(`LootTableEntry ${id} weight must be a non-negative integer.`);
    return { id, min, max, step, group, weight };
}

type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>;

export function CheckLootTableEntry<T extends string = string>(
    entry: AtLeast<ILootTableEntry<T, string | number>, "id">
): AtLeast<ILootTableEntry<T, string | number>, "id"> {
    if (entry.id !== null && !rxLootTableEntryID.test(entry.id)) throw Error(`LootTableEntry ${entry.id} invalid id format.`);
    if (typeof entry.min === "number" && typeof entry.max === "number" && entry.min > entry.max)
        throw Error(`LootTableEntry ${entry.id} min must be less than or equal to max.`);
    if (typeof entry.step === "number" && (!isPositiveInt(entry.step) || entry.step == 0) && !Number.isNaN(entry.step))
        throw Error(`LootTableEntry ${entry.id} step must be a positive integer or NaN.`);
    if (typeof entry.group === "number" && !isPositiveInt(entry.group)) throw Error(`LootTableEntry ${entry.id} group must be a non-negative integer.`);
    if (typeof entry.weight === "number" && !isPositiveInt(entry.weight)) throw Error(`LootTableEntry ${entry.id} weight must be a non-negative integer.`);
    return entry;
}

const loot_defaults: ILootTableEntry = {
    id: null,
    weight: 1,
    min: 1,
    max: 1,
    step: 1,
    group: 1,
    transform: null,
};

function FillInLootEntryDefaults<T extends string = string>(entry: Partial<ILootTableEntry<T>>): ILootTableEntry<T> {
    if (entry.id === undefined) entry.id = null;
    if (entry.weight === undefined) entry.weight = loot_defaults.weight;
    if (entry.min === undefined) entry.min = loot_defaults.min;
    if (entry.max === undefined) entry.max = Math.max(loot_defaults.max, loot_defaults.min);
    if (entry.step === undefined) entry.step = loot_defaults.step;
    if (entry.group === undefined) entry.group = loot_defaults.group;
    return entry as ILootTableEntry<T>;
}

const MAX_NESTED = 100;

export async function LootTableSummaryAsync<
    T extends string = string, // Item Id type
    TID extends string = string // Loot Table Id type
>(table: LootTable<T>, resolver?: LootTableResolverAsync<T, TID>): Promise<LootTable<T>> {
    return _LootTableSummaryAsync(table, resolver);
}

async function _LootTableSummaryAsync<T extends string = string, TID extends string = string>(
    table: LootTable<T>,
    resolver?: LootTableResolverAsync<T, TID>,
    depth: number = 0,
    multiple: number = 1, // Not supported yet
    min: number = 1,
    max: number = 1
): Promise<LootTable<T>> {
    if (!Array.isArray(table)) throw new Error("Not a loot table");
    if (depth > MAX_NESTED) throw new Error(`Too many nested loot tables`);
    let result = sum(condense(table));
    const length = result.length;
    for (let i = 0; i < length; i++) {
        const entry: Partial<ILootTableEntry<T>> & Pick<ILootTableEntry<T>, "id" | "min" | "max"> = FillInLootEntryDefaults(result[i]);
        const group = entry.group;
        delete entry.weight;
        delete entry.step;
        delete entry.group;
        let otherTable = entry._nested;
        let otherCount = 1;
        if (entry.id?.startsWith("@")) {
            const otherInfo = ParseLootID<TID>(entry.id.substring(1));
            if (!otherInfo.id) throw new Error(`Unable to parse ${entry.id}`);
            otherCount = otherInfo.count;
            if (!otherTable) {
                if (!resolver) throw new Error(`No resolver for ${otherInfo.id}`);
                otherTable = await resolver(otherInfo.id);
                if (!otherTable) throw new Error(`${otherInfo.id} could not be resolved`);
            }
        }
        if (otherTable) {
            const otherSummarized = await _LootTableSummaryAsync<T, TID>(otherTable, resolver, depth + 1, otherCount, entry.min, entry.max);
            otherSummarized.map((e) => (e.group = group));
            result.push(...otherSummarized);
            result = condense(result);
            sum(result);
        }
    }
    result.map((e) => delete e.group);
    result = sum(result);
    const scaled = scale(
        result.filter((e) => typeof e.id === "string" && !e.id?.startsWith("@")),
        min,
        max
    );
    return scaled;
}

export function LootTableSummary<
    T extends string = string, // Item Id type
    TID extends string = string // Loot Table Id type
>(table: LootTable<T>, resolver?: LootTableResolver<T, TID>): LootTable<T> {
    return _LootTableSummary(table, resolver);
}

function _LootTableSummary<T extends string = string, TID extends string = string>(
    table: LootTable<T>,
    resolver?: LootTableResolver<T, TID>,
    depth: number = 0,
    multiple: number = 1, // Not supported yet
    min: number = 1,
    max: number = 1
): LootTable<T> {
    if (!Array.isArray(table)) throw new Error("Not a loot table");
    if (depth > MAX_NESTED) throw new Error(`Too many nested loot tables`);
    let result = sum(condense(table));
    const length = result.length;
    for (let i = 0; i < length; i++) {
        const entry: Partial<ILootTableEntry<T>> & Pick<ILootTableEntry, "id" | "min" | "max"> = FillInLootEntryDefaults(result[i]);
        const group = entry.group;
        delete entry.weight;
        delete entry.step;
        delete entry.group;
        let otherTable = entry._nested;
        let otherCount = 1;
        if (entry.id?.startsWith("@")) {
            const otherInfo = ParseLootID<TID>(entry.id.substring(1));
            if (!otherInfo.id) throw new Error(`Unable to parse ${entry.id}`);
            otherCount = otherInfo.count;
            if (!otherTable) {
                if (!resolver) throw new Error(`No resolver for ${otherInfo.id}`);
                otherTable = resolver(otherInfo.id);
                if (!otherTable) throw new Error(`${otherInfo.id} could not be resolved`);
            }
        }
        if (otherTable) {
            const otherSummarized = _LootTableSummary<T, TID>(otherTable, resolver, depth + 1, otherCount, entry.min, entry.max);
            otherSummarized.map((e) => (e.group = group));
            result.push(...otherSummarized);
            result = condense(result);
            sum(result);
        }
    }
    result.map((e) => delete e.group);
    result = sum(result);
    const scaled = scale(
        result.filter((e) => typeof e.id === "string" && !e.id?.startsWith("@")),
        min,
        max
    );
    return scaled;
}

/**
 * Combine all entries with the same id and group, making min be the smallest min, and max be the largest max
 * @param input Loot Table
 * @returns
 */
function condense<T extends string = string>(input: LootTable<T>): LootTable<T> {
    const result = new Array<Partial<ILootTableEntry<T>>>();
    for (const entry of input) {
        const existing = result.find((x) => x.id === entry.id && x.group === entry.group);
        if (existing) {
            existing.min = Math.min(existing.min!, entry.min!);
            existing.max = Math.max(existing.max!, entry.max!);
        } else {
            result.push(CloneEntry<T>(entry));
        }
    }
    return result;
}

/**
 * Combine all entries with the same id, summing the mins and maxes
 * @param input Loot Table
 * @returns
 */
function sum<T extends string = string>(input: LootTable<T>, into?: LootTable<T>): LootTable<T> {
    const result = into ?? new Array<Partial<ILootTableEntry<T>>>();
    for (const entry of input) {
        const existing = result.find((x) => x.id === entry.id);
        if (existing) {
            existing.min! += entry.min!;
            existing.max! += entry.max!;
        } else {
            result.push(CloneEntry<T>(entry));
        }
    }
    return result;
}

function scale<T extends string = string>(input: LootTable<T>, min: number, max: number): LootTable<T> {
    for (const entry of input) {
        entry.min! *= min;
        entry.max! *= max;
    }
    return input;
}

export async function GetLootAsync<
    T extends string = string, // Item Id type
    TID extends string = string // Loot Table Id type
>(table: LootTable<T>, count: number = 1, resolver?: LootTableResolverAsync<T, TID>, depth = 0): Promise<Loot<T>> {
    if (!Array.isArray(table)) throw new Error("Not a loot table");
    if (depth > MAX_NESTED) throw new Error(`Too many nested loot tables`);
    if (count != 1) {
        table = CloneLootTable<T>(table);
    }
    const result = new Array<ILootItem<T>>();
    const groups = new Set();
    table.map((e) => groups.add(e.group));
    for (let pull = 0; pull < count; ++pull) {
        for (const groupID of groups) {
            const entries = table.filter((e) => e.group === groupID).map(FillInLootEntryDefaults);
            const totalWeight = entries.map((e) => e.weight).reduce((a, b) => a + b, 0);
            if (totalWeight == 0) {
                continue;
            }
            const rand = Math.random() * totalWeight;
            let entry: ILootTableEntry<T> | null = null;
            let sum = 0;
            for (const e of entries) {
                sum += e.weight;
                if (sum > rand) {
                    entry = e;
                    break;
                }
            }
            if (entry === null) throw new Error(`No loot table row could be selected.`);
            const range = isNaN(entry.step) ? entry.max - entry.min : Math.floor((entry.max - entry.min + entry.step) / entry.step);
            const rnd = entry.transform ? entry.transform(Math.random()) : Math.random();
            let quantity = entry.min + (isNaN(entry.step) ? rnd * range : Math.floor(rnd * range) * entry.step);
            let absQuantity = Math.abs(quantity);
            if (absQuantity > 0) {
                if (count != 1) {
                    absQuantity = Math.max(absQuantity, entry.weight);
                    quantity = quantity < 0 ? -absQuantity : absQuantity;
                    entry.weight -= absQuantity;
                }
                let otherTable = entry._nested;
                let otherCount = 1;
                if (entry.id?.startsWith("@")) {
                    const otherInfo = ParseLootID<TID>(entry.id.substring(1));
                    otherCount = otherInfo.count;
                    if (!otherInfo.id) throw new Error(`Unable to parse ${entry.id}`);
                    if (!otherTable) {
                        if (!resolver) throw new Error(`No resolver for ${otherInfo.id}`);
                        otherTable = await resolver(otherInfo.id);
                        if (!otherTable) throw new Error(`${otherInfo.id} could not be resolved`);
                    }
                }
                if (otherTable) {
                    for (let i = 0; i < quantity; i++) {
                        const loot = await GetLootAsync(otherTable, otherCount, resolver, ++depth);
                        depth--;
                        MergeLoot(result, loot);
                    }
                } else {
                    if (entry.id !== null) {
                        AddLoot<T>(result, { id: entry.id as T, quantity });
                    }
                }
            }
        }
    }
    return result;
}

export function GetLoot<
    T extends string = string, // Item Id type
    TID extends string = string // Loot Table Id type
>(table: LootTable<T>, count: number = 1, resolver?: LootTableResolver<T, TID>, depth = 0): Loot<T> {
    if (!Array.isArray(table)) throw new Error("Not a loot table");
    if (depth > MAX_NESTED) throw new Error(`Too many nested loot tables`);
    if (count != 1) {
        table = CloneLootTable(table);
    }
    const result = new Array<ILootItem<T>>();
    const groups = new Set();
    table.map((e) => groups.add(e.group));
    for (let pull = 0; pull < count; ++pull) {
        for (const groupID of groups) {
            const entries = table.filter((e) => e.group === groupID).map(FillInLootEntryDefaults);
            const totalWeight = entries.map((e) => e.weight).reduce((a, b) => a + b, 0);
            if (totalWeight == 0) {
                continue;
            }
            const rand = Math.random() * totalWeight;
            let entry: ILootTableEntry | null = null;
            let sum = 0;
            for (const e of entries) {
                sum += e.weight;
                if (sum > rand) {
                    entry = e;
                    break;
                }
            }
            if (entry === null) throw new Error(`No loot table row could be selected.`);
            const range = isNaN(entry.step) ? entry.max - entry.min : Math.floor((entry.max - entry.min + entry.step) / entry.step);
            const rnd = entry.transform ? entry.transform(Math.random()) : Math.random();
            let quantity = entry.min + (isNaN(entry.step) ? rnd * range : Math.floor(rnd * range) * entry.step);
            let absQuantity = Math.abs(quantity);
            if (absQuantity > 0) {
                if (count != 1) {
                    absQuantity = Math.max(absQuantity, entry.weight);
                    quantity = quantity < 0 ? -absQuantity : absQuantity;
                    entry.weight -= absQuantity;
                }
                let otherTable = entry._nested;
                let otherCount = 1;
                if (entry.id?.startsWith("@")) {
                    const otherInfo = ParseLootID<TID>(entry.id.substring(1));
                    otherCount = otherInfo.count;
                    if (!otherInfo.id) throw new Error(`Unable to parse ${entry.id}`);
                    if (!otherTable) {
                        if (!resolver) throw new Error(`No resolver for ${otherInfo.id}`);
                        otherTable = resolver(otherInfo.id);
                        if (!otherTable) throw new Error(`${otherInfo.id} could not be resolved`);
                    }
                }
                if (otherTable) {
                    for (let i = 0; i < quantity; i++) {
                        const loot = GetLoot(otherTable, otherCount, resolver, ++depth);
                        depth--;
                        MergeLoot(result, loot);
                    }
                } else {
                    if (entry.id !== null) {
                        AddLoot(result, { id: entry.id as T, quantity });
                    }
                }
            }
        }
    }
    return result;
}
