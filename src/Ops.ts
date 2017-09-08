import { Value } from './Utils';

export class ReadOp { }
export class ReadOpPartial { }

export class PartialEq extends ReadOpPartial {
    value: Value;

    constructor(value: Value) {
        super();
        this.value = value;
    }
    addField(field: string) {
        return new LoadEq(field, this.value);
    }
}

export class LoadEq extends ReadOp {
    field: string;
    value: Value;

    constructor(field: string, value: Value) {
        super();
        this.field = field;
        this.value = value;
    }
}

export class PartialIn extends ReadOpPartial {
    values: Value[];

    constructor(...values: Value[]) {
        super();
        if (values.length === 0) throw "Empty In operator!";
        this.values = values;
    }
    addField(field: string) {
        return new LoadIn(field, ...this.values);
    }
}

export class LoadIn extends ReadOp {
    field: string;
    values: Value[];

    constructor(field: string, ...values: Value[]) {
        super();
        if (values.length === 0) throw "Empty In operator!";
        this.field = field;
        this.values = values;
    }
}

export class PartialLt extends ReadOpPartial {
    value: Value;

    constructor(value: Value) {
        super();
        this.value = value;
    }
    addField(field: string) {
        return new LoadLt(field, this.value);
    }
}

export class LoadLt extends ReadOp {
    field: string;
    value: Value;

    constructor(field: string, value: Value) {
        super();
        this.field = field;
        this.value = value;
    }
}

export class PartialLte extends ReadOpPartial {
    value: Value;

    constructor(value: Value) {
        super();
        this.value = value;
    }
    addField(field: string) {
        return new LoadLte(field, this.value);
    }
}

export class LoadLte extends ReadOp {
    field: string;
    value: Value;

    constructor(field: string, value: Value) {
        super();
        this.field = field;
        this.value = value;
    }
}

export class PartialGt extends ReadOpPartial {
    value: Value;

    constructor(value: Value) {
        super();
        this.value = value;
    }
    addField(field: string) {
        return new LoadGt(field, this.value);
    }
}

export class LoadGt extends ReadOp {
    field: string;
    value: Value;

    constructor(field: string, value: Value) {
        super();
        this.field = field;
        this.value = value;
    }
}

export class PartialGte extends ReadOpPartial {
    value: Value;

    constructor(value: Value) {
        super();
        this.value = value;
    }
    addField(field: string) {
        return new LoadGte(field, this.value);
    }
}

export class LoadGte extends ReadOp {
    field: string;
    value: Value;

    constructor(field: string, value: Value) {
        super();
        this.field = field;
        this.value = value;
    }
}

export class PartialGtLt extends ReadOpPartial {
    start: Value;
    end: Value;

    constructor(start: Value, end: Value) {
        super();
        this.start = start;
        this.end = end;
    }
    addField(field: string) {
        return new LoadGtLt(field, this.start, this.end);
    }
}

export class LoadGtLt extends ReadOp {
    field: string;
    start: Value;
    end: Value;

    constructor(field: string, start: Value, end: Value) {
        super();
        this.field = field;
        this.start = start;
        this.end = end;
    }
}

export class PartialGteLt extends ReadOpPartial {
    start: Value;
    end: Value;

    constructor(start: Value, end: Value) {
        super();
        this.start = start;
        this.end = end;
    }
    addField(field: string) {
        return new LoadGteLt(field, this.start, this.end);
    }
}

export class LoadGteLt extends ReadOp {
    field: string;
    start: Value;
    end: Value;

    constructor(field: string, start: Value, end: Value) {
        super();
        this.field = field;
        this.start = start;
        this.end = end;
    }
}

export class PartialGtLte extends ReadOpPartial {
    start: Value;
    end: Value;

    constructor(start: Value, end: Value) {
        super();
        this.start = start;
        this.end = end;
    }
    addField(field: string) {
        return new LoadGtLte(field, this.start, this.end);
    }
}

export class LoadGtLte extends ReadOp {
    field: string;
    start: Value;
    end: Value;

    constructor(field: string, start: Value, end: Value) {
        super();
        this.field = field;
        this.start = start;
        this.end = end;
    }
}

export class PartialGteLte extends ReadOpPartial {
    start: Value;
    end: Value;

    constructor(start: Value, end: Value) {
        super();
        this.start = start;
        this.end = end;
    }
    addField(field: string) {
        return new LoadGteLte(field, this.start, this.end);
    }
}

export class LoadGteLte extends ReadOp {
    field: string;
    start: Value;
    end: Value;

    constructor(field: string, start: Value, end: Value) {
        super();
        this.field = field;
        this.start = start;
        this.end = end;
    }
}

function convertObject(obj: { [key:string]:any; }): ReadOp|null {
    let ops = [];
    for (const field in obj) {
        let value = obj[field];
        switch (value.constructor) {
            case Number:
            case String:
                value = new LoadEq(field, value);
                break;
            case Array:
                value = new LoadIn(field, ...value);
                break;
            case PartialEq:
            case PartialIn:
            case PartialLt:
            case PartialLte:
            case PartialGt:
            case PartialGte:
            case PartialGtLt:
            case PartialGteLt:
            case PartialGtLte:
            case PartialGteLte:
                value = value.addField(field);
                break;
            case And:
            case Or:
                break;
            default:
                throw "Bad op passed!";
        }
        ops.push(value); // Pushes the now parsed op
    }

    // Return ReadOp|null based on the ops:
    if (ops.length > 1) {
        return new And(...ops);
    } else if (ops.length === 1) {
        return ops[0];
    } else {
        return null;
    }
}

export class And extends ReadOp {
    ops: ReadOp;

    constructor(...ops: (ReadOp | Object)[]) {
        super();
        if (ops.length === 0) throw "Empty And operator!";
        // Resolve any objects in ops:
        for (let i = 0; i < ops.length; i++) {
            // Check if not ReadOp:
            if (!(ops[i] instanceof ReadOp)) {
                // Is object, so convert to a AndOp:
                let op = convertObject(ops[i]);
                if (op == null) throw "Bad op!";
                ops[i] = op;
            }
        }
        this.ops = ops;
    }
}

export class Or extends ReadOp {
    ops: ReadOp;

    constructor(...ops: (ReadOp | Object)[]) {
        super();
        if (ops.length === 0) throw "Empty Or operator!";
        // Resolve any objects in ops:
        for (let i = 0; i < ops.length; i++) {
            // Check if not ReadOp:
            if (!(ops[i] instanceof ReadOp)) {
                // Is object, so convert to a AndOp:
                let op = convertObject(ops[i]);
                if (op == null) throw "Bad op!";
                ops[i] = op;
            }
        }
        this.ops = ops;
    }
}