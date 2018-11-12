const {MongoClient} = require('mongodb');

const ObjectID = require('mongodb').ObjectID;

function mongodb_promise() {
    this.mongodb = null;
    this.mongo_client = null;
    this.mongo_db = null;
}

// 连接
mongodb_promise.prototype.connect = function(url, db_name, options) {
    return new Promise( (resolve, reject) => {
        MongoClient.connect(url, options, (err, client) => {
            if (err) reject(err);
            this.mongo_client = client;
            this.mongo_db = this.mongo_client.db(db_name);
            //console.log(this.mongo_db.s.databaseName);
            //console.log("connect callback");
            resolve(this.mongo_db);
        });
    });
}

mongodb_promise.prototype.switchdb = function(db_name) {
    this.mongo_db = mongo_client.db(db_name);
}

mongodb_promise.prototype.close = () => {
    if(this.mongo_db) {
        this.mongo_db.close();
        this.mongo_db = null;
    }
    if(this.mongo_client) {
        this.mongo_client.close();
        this.mongo_client = null;
    }
}

// 插入方法
mongodb_promise.prototype.insertOne = function(collection_name, obj) {
    return new Promise( (resolve, reject) => {
        //console.log("insert",this.mongo_db.s.databaseName);
        const collection = this.mongo_db.collection(collection_name);
        collection.insertOne(obj, {w: 1}, function(err, res) {
            if (err) reject(err);
            else resolve(res[0]);
        });
    });
}

// 更新
mongodb_promise.prototype.updateOne = function(collection_name, query, obj)  {
    return new Promise( (resolve, reject) => {
        const collection = this.mongo_db.collection(collection_name);
        collection.updateOne(query, obj, {upsert: true,w: 1}, function(err, res) {
            if (err) reject(err);
            else resolve(res);
        });
    });
}

mongodb_promise.prototype.updateMany = function(collection_name, query, obj)  {
    return new Promise( (resolve, reject) => {
        const collection = this.mongo_db.collection(collection_name);
        collection.updateMany(query, obj, {}, function(err, res) {
            if (err) reject(err);
            else resolve(res);
        });
    });
}

// 更新
mongodb_promise.prototype.replaceOne = function(collection_name, filter, obj, options) {
    return new Promise( (resolve, reject) => {
        //console.log("replaceOne",this.mongo_db.s.databaseName);
        const collection = this.mongo_db.collection(collection_name);
        collection.replaceOne(filter, obj, options, function(err, res) {
            if (err) reject(err);
            else resolve(res);
        });
    });
}

// 查找一个
mongodb_promise.prototype.findOne = function(collection_name, query, option)  {
    return new Promise( (resolve, reject) => {
        const collection = this.mongo_db.collection(collection_name);
        if(option==undefined || option==null)
        {
            collection.findOne(query, function(err, res) {
                if (err) reject(err);
                else resolve(res);
            });
        }else{
            collection.findOne(query, option, function(err, res) {
                if (err) reject(err);
                else resolve(res);
            });
        }
    });
}

// 查找多个
mongodb_promise.prototype.find = function(collection_name, query, option)  {
    return new Promise( (resolve, reject) => {
        var collection = this.mongo_db.collection(collection_name);
        if(option==undefined || option==null)
        {
            collection.find(query).toArray(function(err, res) {
                if (err) reject(err);
                else resolve(res);
            });
        }else{
            collection.find(query, option).toArray(function(err, res) {
                if (err) reject(err);
                else resolve(res);
            });
        }
    });
}

// 查找带分页
mongodb_promise.prototype.find_page = function(collection_name, query, sort, page_index, page_size)  {
    return new Promise( (resolve, reject) => {
        var collection = this.mongo_db.collection(collection_name);
        const option = {
            sort:sort,
            limit:page_size,
            skip:page_index*page_size
        };
        collection.find(query, option).toArray(function(err, res) {
            if (err) reject(err);
            else resolve(res);
        });
    });
}

// 删除
mongodb_promise.prototype.remove = function(collection_name, query)  {
    return new Promise( (resolve, reject) => {
        var collection = this.mongo_db.collection(collection_name);
        collection.remove(query, {w: 1}, function(err, res) {
            if (err) reject(err);
            else resolve(res);
        });
    });
}

// 计数
mongodb_promise.prototype.count = function(collection_name, query, option) {
    return new Promise( (resolve, reject) => {
        var collection = this.mongo_db.collection(collection_name);
        if(query==undefined || query==null)
            query = {};
        if(option==undefined || option==null)
        {
            collection.count(query, (err, count) => {
                if (err) reject(err);
                else resolve(count);
            });
        }else{
            collection.count(query, option, (err, count) => {
                if (err) reject(err);
                else resolve(count);
            });
        }
    });
}

// 创建索引
mongodb_promise.prototype.createIndex = function(collection_name, fieldOrSpec, option) {
    return new Promise( (resolve, reject) => {
        var collection = this.mongo_db.collection(collection_name);
        collection.createIndex(fieldOrSpec, option, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}

module.exports = mongodb_promise;
