"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Collection_1 = require("../Collection");
const Cursor_1 = require("../Cursor");
const Ops = require("../Ops");
const PromiseResult_1 = require("../PromiseResult");
const Query_1 = require("./Query");
const Request_1 = require("../Request");
/**
 * Purpose: A class that represents an in-progress query.
 * A ```ReadQuery``` is chainable so additional methods can be used to modify the query before it is submitted to the database.
 *
 * **_This class is created internally as a result of other methods and should never be constructed directly._**
 */
class ReadQuery extends Query_1.Query {
    /**
     * **_ Should not be called by the user _**
     */
    constructor(collection, optree, projection) {
        super(collection);
        this.optree = optree;
        this.projection = projection;
    }
    /**
     * Purpose: Set a parameter on the ```Collection``` object that the ```ReadQuery``` was created from.
     * The parameter tells the database to provide information about the queries that are performed
     *
     * Example:
     * ```javascript
     * collection.find({ name: "Alex" }).explain().fetchAll().then((results, t) => {
     *  console.log(results);
     *  console.log(t);
     * });
     * ```
     * @param { boolean } isOn Indicates if parameter should be set or unset
     * @returns { ReadQuery } A new ```ReadQuery```, with a reference to a newly created ```Collection``` containing the modified parameter
     */
    // Sets the explain variable on a new Collection object that the new ReadQuery will refer to
    explain(isOn) {
        const collection = new Collection_1.Collection(this.collection.db, this.collection.collectionName, { explain: isOn });
        return new ReadQuery(collection, this.optree);
    }
    /**
     * Purpose: Set options for a query
     *
     * Example:
     * ```javascript
     * collection.find({ name: "Alex" }).options({ explain: true });
     * ```
     * Note: Options are being worked on. There will be more in the future...
     * @param { JSON } options A field-value pair that contains one or more options and their desired values
     * @param { boolean } options.explain Sets a parameter that tells the database to provide information about the queries that are performed - same functionality as ```Collection.explain```
     * @returns { ReadQuery } A new ```ReadQuery```, with a reference to a newly created ```Collection``` containing the modified parameters
     */
    // Allows multiple options to be set through a JSON interface
    options(options) {
        const collection = new Collection_1.Collection(this.collection.db, this.collection.collectionName, options);
        return new ReadQuery(collection, this.optree);
    }
    /**
     * Purpose: A chainable method that allows the user to "And" the current query with one or more additional patterns
     *
     * Example:
     * ```javascript
     * collection.find({ name: "Dillon" }).and({ position: "developer" }).fetchAll().then((results) => {
     *  console.log(results);
     * });
     * ```
     * @param { ReadOp | Object } patterns The additional pattern(s) that will be "And"ed with the existing ```ReadQuery```
     * @returns { ReadQuery } A new ```ReadQuery``` with the new pattern(s) incorporated
     */
    // Applies an And operator to a chain
    and(...patterns) {
        let readQuery;
        // Check if there are results from the command before
        if (this.optree != null) {
            readQuery = new Ops.And(this.optree, ...patterns);
        }
        else if (patterns.length === 1) {
            readQuery = Ops.resolveReadOp(patterns[0]);
            if (readQuery == null)
                throw "Bad op!";
        }
        else {
            readQuery = new Ops.And(...patterns);
        }
        return new ReadQuery(this.collection, readQuery);
    }
    /**
     * Purpose: A chainable method that allows the user to "Or" the current query with one or more additional patterns
     *
     * Example:
     * ```javascript
     * collection.find({ name: "Todd" }).or({ name: "Tom" }).fetchAll().then((results) => {
     *  console.log(results);
     * });
     * ```
     * @param { ReadOp | Object } patterns The additional pattern(s) that will be "Or"ed with the existing ```ReadQuery```
     * @returns { ReadQuery } A new ```ReadQuery``` with the new pattern(s) incorporated
     */
    // Applies an Or operator to a chain
    or(...patterns) {
        // If there are no previous results to Or with
        if (this.optree == null)
            return this;
        else {
            return new ReadQuery(this.collection, new Ops.Or(this.optree, ...patterns));
        }
    }
    /**
     * Purpose: A consuming method that takes the current ```Query``` and executes it, returning just the number of items in the collection that match the query
     *
     * Example:
     * ```javascript
     * collection.find({ name: "Dillon" }).count().then((resultCnt) => {
     *  console.log(resultCnt);
     * });
     * ```
     * @returns { Promise } An integer that indicates how many items in the collection that match the query being consumed
     */
    // Count items based on matches from ReadQuery
    count() {
        return this.send(Request_1.PayloadRequestType.Count, this.serialize());
    }
    /**
     * Purpose: A consuming method that takes the current ```Query``` and executes it, returning a ```Cursor``` that can be used to access a stream of the results
     *
     * Example:
     * ```javascript
     * await const cursor = collection.find({ name: "Dillon" }).fetch();
     * cursor.next().then((results) => {
     *  console.log(results);
     * });
     * ```
     * @param { ProjectionOpPartial | string } [fields] A ```PartialOpPartial``` object created using ```Dex.include``` or ```Dex.exclude```.
     * If one or more ```string```s are passed, the default behavior is to include those fields
     *
     * Note: ```fetch``` will accept multiple ```string``` values or a single ```PartialOpPartial```, **but not both**
     * @returns { Promise } A ```Cursor``` that can be used to access a stream of results that match the query
     */
    // Fetch items based on matches from ReadQuery
    fetch(...fields) {
        let projection;
        if (fields.length === 0) {
            projection = this.projection;
        }
        else {
            const firstField = fields[0];
            switch (firstField.constructor) {
                case String:
                    projection = { type: Request_1.ProjectionType.Include, data: fields };
                    break;
                case Ops.PartialExclude:
                case Ops.PartialInclude:
                    projection = firstField.resolve();
                    break;
                default:
                    throw 'Bad op passed!';
            }
        }
        const readQuery = this;
        return new PromiseResult_1.PromiseResult((resolve, reject) => {
            this.send(Request_1.PayloadRequestType.Fetch, { ops: this.serialize(), projection: projection })
                .then(function (fetchResult) {
                const explainResult = new PromiseResult_1.ExplainResult(new Cursor_1.Cursor(readQuery.collection, fetchResult.cursor, fetchResult.items, arguments[1]), arguments[1]);
                resolve(explainResult);
            }, reject);
        });
    }
    /**
     * Purpose: A consuming method that takes the current ```Query``` and executes it, returning all of the actual items in the collection that match the query
     *
     * Note: Equivalent to running ```fetch``` and then calling ```Cursor.collect()```
     *
     * Example:
     * ```javascript
     * collection.find({ name: "Dillon" }).fetchAll().then((results) => {
     *  console.log(results);
     * });
     * ```
     * @param { ProjectionOpPartial | string } [fields] A ```PartialOpPartial``` object created using ```Dex.include``` or ```Dex.exclude```.
     * If one or more ```string```s are passed, the default behavior is to include those fields
     *
     * Note: ```fetchAll``` will accept multiple ```string``` values or a single ```PartialOpPartial```, **but not both**
     * @returns { Promise } An array of results that match the query
     */
    // Fetch items based on matches from ReadQuery
    fetchAll(...fields) {
        return new PromiseResult_1.PromiseResult((resolve, reject) => {
            this.fetch(...fields).then((cursor) => {
                cursor.collect()
                    .then((items) => {
                    const explainResult = new PromiseResult_1.ExplainResult(items, cursor.getExplainResults());
                    resolve(explainResult);
                }, reject);
            }, reject);
        });
    }
    /**
     * Purpose: A consuming method that takes the current ```Query``` and executes it, removing the items found by the query
     *
     * Example:
     * ```javascript
     * await collection.find({ name: "Dillon" }).remove();
     * ```
     * @returns { Promise } ```true``` if the removal was successful, ```false``` if the removal fails
     */
    // Remove items based on matches from ReadQuery
    remove() {
        return this.send(Request_1.PayloadRequestType.Remove, this.serialize());
    }
    /**
     * Purpose: A consuming method that takes the current ```Query``` and executes it, removing the items found by the query and replacing them with the passed object
     *
     * Example:
     * ```javascript
     * await collection.find({ name: "Todd" }).replace( { name: "Tom", age: 23 });
     * ```
     * @param { JSON } item The item that will be replacing the matched items
     * @returns { Promise } ```true``` if the replacement was successful, ```false``` if the replacement fails
     */
    // Replaces the matched objects with the designated items
    replace(item) {
        return this.send(Request_1.PayloadRequestType.Update, new Request_1.UpdateOps(this.serialize(), new Request_1.UpdateKind(Request_1.UpdateKindType.Overwrite, item)));
    }
    /**
     * Purpose: A consuming method that takes the current ```Query``` and executes it, removing the items found by the query and replacing them with the passed object
     *
     * Example:
     * ```javascript
     * await collection.find({ name: "Tom" }).update({ name: "Todd", age: Dex.delete() });
     * ```
     * @param { JSON } item Field-value pairs that indicate what the new value of the field(s) should be or a ```PartialDelete``` shorthand operator
     * @returns { Promise } ```true``` if the update was successful, ```false``` if the update fails
     */
    // Updates items in the collection based on previous match results
    update(updateFields) {
        return this.send(Request_1.PayloadRequestType.Update, new Request_1.UpdateOps(this.serialize(), new Request_1.UpdateKind(Request_1.UpdateKindType.Partial, Ops.convertUpdateObject(updateFields))));
    }
    // Serializes the ReadQuery
    serialize() {
        let opList = [];
        if (this.optree != null) {
            this.optree.serialize(opList);
        }
        return opList;
    }
    // Prepares the message to be sent
    send(type, data) {
        return this.collection.db.sendJSON({ type: type, data: data }, this.collection._explain, this.collection.collectionName);
    }
}
exports.ReadQuery = ReadQuery;
