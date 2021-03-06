import { CollectionTag } from './Utils';

enum OpType {
    LoadEq = "LoadEq",
    LoadIn = "LoadIn",
    LoadLt = "LoadLt",
    LoadLte = "LoadLte",
    LoadGt = "LoadGt",
    LoadGte = "LoadGte",
    LoadGtLt = "LoadGtLt",
    LoadGteLt = "LoadGteLt",
    LoadGtLte = "LoadGtLte",
    LoadGteLte = "LoadGteLte",
    And = "And",
    Or = "Or"
}

export enum PayloadRequestType {
    None = "None",
    Count = "Count",
    Cursor = "Cursor",
    Fetch = "Fetch",
    Insert = "Insert",
    Update = "Update",
    Remove = "Remove",
    EnsureIndex = "EnsureIndex",
    RemoveIndex = "RemoveIndex",
    RemoveCollection = "RemoveCollection"
}

export enum ProjectionType {
    All = "All",
    Include = "Include",
    Exclude = "Exclude"
}

export enum UpdateKindType {
    Overwrite = "Overwrite",
    Partial = "Partial"
}

interface FetchOps {
    ops: Op[],
    projection: Projection
}

interface FieldValue {
    field: string,
    value: any 
}

interface FieldValues {
    field: string,
    values: any[]
}

interface FieldValueRange {
    field: string,
    low: any,
    high: any
}

export interface Op {
    type: OpType,
    data: any
}

export interface PayloadRequest {
    type: PayloadRequestType,
    data?: any
}

export interface Projection {
    type: ProjectionType,
    data: any
}

export interface RequestMessage {
    request_id: string,
    payload: PayloadRequest,
    collection: CollectionTag,
    explain: boolean
}

export class UpdateKind {
    constructor(public type: UpdateKindType, public data: any) { }
}

export class UpdateOps {
    constructor(public ops: Op[], public update_kind: UpdateKind) { }
}

export interface UpdatePartial {
    set: Map<string, any>,
    unset: string[]
}