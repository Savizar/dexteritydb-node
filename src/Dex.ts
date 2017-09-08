import * as WebSocket from 'ws';
import { Collection } from './Collection';
import * as Ops from './Ops';
import { ResponseMessage } from './Response';
import { Value } from './Utils';

interface RequestCallback {
    resolve: Function,
    reject: Function
}

export class Dex {
    private url: string;
    private ready: boolean;

    constructor(url: string) {
        this.url = url;
        this.ready = false;
        let activeRequests = new Map<string, RequestCallback>();
        const db = this;
        const ws = new WebSocket(url);

        ws.addEventListener("open", () => {
            db.ready = true;
            console.log("Connected to DexterityDB");
        });

        ws.addEventListener("close", () => {
            if (db.ready) {
                console.log("Disconnected from DexterityDB");
                db.ready = false;
                // TODO: Auto-reconnect
            }
        });

        ws.addEventListener("message", (message) => {
            let messageData: ResponseMessage;
            try {
                messageData = JSON.parse(message.data.toString());
            } catch (err) {
                return console.error(err);
            }

            if (messageData.request_id != null) {
                const callback = activeRequests.get(messageData.request_id);
                if (callback != null) {
                    activeRequests.delete(messageData.request_id);
                    callback.resolve(messageData.payload.data);
                }
            }
        });
    }

    collection(collectionName: string) {
        return new Collection(this, collectionName);
    }

    static eq(value: Value) {
        return new Ops.PartialEq(value);
    }
    static in(...values: Value[]) {
        return new Ops.PartialIn(...values);
    }
    static lt(value: Value) {
        return new Ops.PartialLt(value);
    }
    static lte(value: Value) {
        return new Ops.PartialLte(value);
    }
    static gt(value: Value) {
        return new Ops.PartialGt(value);
    }
    static gte(value: Value) {
        return new Ops.PartialGte(value);
    }
    static gt_lt(start: Value, end: Value) {
        return new Ops.PartialGtLt(start, end);
    }
    static gte_lt(start: Value, end: Value) {
        return new Ops.PartialGteLt(start, end);
    }
    static gt_lte(start: Value, end: Value) {
        return new Ops.PartialGtLte(start, end);
    }
    static gte_lte(start: Value, end: Value) {
        return new Ops.PartialGteLte(start, end);
    }

    static and(...ops: (Ops.ReadOp | object)[]) {
        return new Ops.And(...ops);
    }
    static or(...ops: (Ops.ReadOp | object)[]) {
        return new Ops.Or(...ops);
    }
}