const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

function mongodb_promise() {
    this.mongo_client = null;
    this.mongo_db = null;
}

// 连接
mongodb_promise.prototype.connect = (url, db_name, options) => {
    return new Promise(function(resolve, reject) {
        MongoClient.connect(url, options, function(err, client) {
            if (err) reject(err);
            this.mongo_client = client;
            this.mongo_db = this.mongo_client.db(db_name);
            resolve(mongo_db);
        });
    });
}

mongodb_promise.prototype.switchdb = (db_name) => {
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
mongodb_promise.prototype.insert = (collection_name, obj) => {
    return new Promise(function(resolve, reject) {
        const collection = this.mongo_db.collection(collection_name);
        collection.insert(obj, {w: 1}, function(err, res) {
            if (err) reject(err);
            else resolve(res[0]);
        });
    });
}

// 更新
mongodb_promise.prototype.update = (collection_name, obj) => {
    return new Promise(function(resolve, reject) {
        const collection = this.mongo_db.collection(collection_name);
        collection.update({_id: new ObjectID(obj._id)}, obj, {upsert: true,w: 1}, function(err, res) {
            if (err) reject(err);
            else resolve(res);
        });
    });
}

// 更新
mongodb_promise.prototype.replaceOne = (collection_name, filter, obj, options) => {
    return new Promise(function(resolve, reject) {
        const collection = this.mongo_db.collection(collection_name);
        collection.replaceOne(filter, obj, options, function(err, res) {
            if (err) reject(err);
            else resolve(res);
        });
    });
}

// 查找一个
mongodb_promise.prototype.findOne = (collection_name, query, option) => {
    return new Promise(function(resolve, reject) {
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
mongodb_promise.prototype.find = (collection_name, query, option) => {
    return new Promise(function(resolve, reject) {
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
mongodb_promise.prototype.find_page = (collection_name, query, sort, page_index, page_size) => {
    return new Promise(function(resolve, reject) {
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
mongodb_promise.prototype.remove = (collection_name, query) => {
    return new Promise(function(resolve, reject) {
        var collection = this.mongo_db.collection(collection_name);
        collection.remove(query, {w: 1}, function(err, res) {
            if (err) reject(err);
            else resolve(res);
        });
    });
}

// 计数
mongodb_promise.prototype.count = (collection_name, query, option) => {
    return new Promise(function(resolve, reject) {
        var collection = this.mongo_db.collection(collection_name);
        if(query==undefined || query==null)
            query = {};
        if(option==undefined || option==null)
        {
            collection.count(query, function(err, count) {
                if (err) reject(err);
                else resolve(count);
            });
        }else{
            collection.count(query, option, function(err, count) {
                if (err) reject(err);
                else resolve(count);
            });
        }
    });
}

module.exports = mongodb_promise;
