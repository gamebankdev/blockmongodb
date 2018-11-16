const gamebank = require("gamebank");
const fs = require("fs");
const request = require("axios");
const config = require("config").get("Config");
const mongodb_promise = require("./../mongodb/mongodb_promise");
const mongodb = new mongodb_promise();

var cur_head_block_number = 0;
var last_head_block_number = 0;
var pending_sync_count = 0;
var error_block_nums = [];

var start_time = 0;
var total_block = 0;

gamebank.api.setOptions({ url: config.gamebank.server });
gamebank.config.set("address_prefix", config.gamebank.address_prefix);
gamebank.config.set("chain_id", config.gamebank.chain_id);

const db_get_global_properties = async (property_name,) => {
  let property_value = await mongodb.findOne("__global_properties__", {'name':property_name});
  return property_value;
}

const db_set_global_properties = async (property_name, property_value) => {
  let result = await mongodb.replaceOne("__global_properties__", {'name':property_name}, {'name':property_name, 'value':property_value}, {upsert:true});
  return result;
}

// 获取区块数据
const requestBlockData = async (block_num) => {
  // console.log(block_num)
  try {
    const data = await gamebank.api.getBlockAsync(block_num);

    let result = data;
    if (result == null || result == undefined) {
      result = {};
    }
    const { transactions = [] } = result;

    let transactionIndex = -1;
    transactions.forEach(transaction => {
      transactionIndex++;
      const { operations = [], transaction_id } = transaction;
      operations.forEach(async (operation = []) => {
        const [operationName, operationArgs] = operation;
        // 转账
        if (operationName == "transfer") {
          const { from,to,amount,memo = JSON.stringify({}) } = operationArgs;
          try {
            console.log(from,"->",to,amount,transaction_id, config.watch_wallet.indexOf(to));
            let amountInt = parseInt( Number(amount.substr(0, amount.length-2).trim())*1000 ); // 去掉GB
            if(config.watch_wallet.indexOf(to) >= 0){
              console.log("wallet_notify",from,"->",to,amountInt,transaction_id);
              let insert_obj = {transaction_id:transaction_id, currency:"gb", from:from, to:to, amount:amountInt, memo:memo, block_num:block_num, retry_count:0, status:0};
              try {
                let ret = await mongodb.insertOne("wallet_notify", insert_obj);
              } catch (error) {
                if(error.code != 11000){
                  throw error;
                }
              }
              //await mongodb.replaceOne("wallet_notify", {'transaction_id':transaction_id}, insert_obj, {upsert:true});
            }
            let insert_obj = {transaction_id:transaction_id, from:from, to:to, amount:amountInt, memo:memo, block_num:block_num};
            try {
              let ret = await mongodb.insertOne("transfer", insert_obj);
            } catch (error) {
              if(error.code != 11000){
                throw error;
              }
            }
            //await mongodb.replaceOne("transfer", {'transaction_id':transaction_id}, insert_obj, {upsert:true});
          }
          catch(e) {
            // todo: how to check dupkey exception
            //console.log("exception", e);
            //console.log(from,"->",to,amount,transaction_id);
            console.log("sync blockerror1 block_num", block_num, "pending_sync_count", pending_sync_count,"transactionIndex",transactionIndex);
            pending_sync_count--;
            fs.appendFile("./log/blockerr.log", block_num+" "+transactionIndex+" "+transaction_id+"\n",function(err){});
            error_block_nums.push({block_num:block_num, transactionIndex:transactionIndex});
            return false;
          }
        }
      });
    });
    // var ret = await db_set_global_properties("last_sync_head_block_number", block_num);
    //last_head_block_number = block_num;
    // console.log(block_num);
    total_block++;
    if((block_num%1000) == 0){
      console.log("block_log block_num", block_num,"speed", (total_block/((Date.now()-start_time)/1000)));
    }
    pending_sync_count--;
    return true;
  } catch (err) {
    // todo: 错误的block记录一下
    //request_head_block_number(read_file_contract_number());
    console.log("sync blockerror2 block_num", block_num, "pending_sync_count", pending_sync_count);
    //console.log("err", err);
    fs.appendFile("./log/blockerr.log", block_num+"\n",function(err){});
    pending_sync_count--;
    error_block_nums.push({block_num:block_num, transactionIndex:-1});
    return false;
  }
}

const start_sync_func = async () => {
  console.log(config.block_sync.block_log_db);
  let db = await mongodb.connect(config.mongo.url, config.block_sync.block_log_db, {autoReconnect:true,keepAlive:true});
  await mongodb.createIndex("transfer",{transaction_id:1}, {unique:true});
  await mongodb.createIndex("wallet_notify",{transaction_id:1}, {unique:true});
  let last_sync_head_block_number = await db_get_global_properties("last_sync_head_block_number");
  if(last_sync_head_block_number == null ) {
    last_sync_head_block_number = {'name':"last_sync_head_block_number", 'value':0};
  }
  console.log("block_log last_sync_head_block_number", last_sync_head_block_number.value);
  last_head_block_number = last_sync_head_block_number.value;

  start_time = Date.now();
  const { head_block_number } = await gamebank.api.getDynamicGlobalPropertiesAsync();
  cur_head_block_number = head_block_number;
  
  setInterval(async () => {
    for(let i=error_block_nums.length-1,j=0; i>=0 && j<config.block_sync.resync_per_sec; i--,j++){
      console.log("resync block_log",error_block_nums[i].block_num,"length",error_block_nums.length);
      pending_sync_count++;
      requestBlockData(error_block_nums[i].block_num)
      error_block_nums.splice(i,1);
    }

    gamebank.api.getDynamicGlobalProperties(function(err,result) {
      if(err){
        console.log("getDynamicGlobalProperties err",err);
      } else {
        if(result)
          cur_head_block_number = result.head_block_number;
        else
          console.error("getDynamicGlobalProperties result=null");
      }
    });
    let head_block_number = cur_head_block_number;
    //console.log("get head_block_number",head_block_number,"last_head_block_number",last_head_block_number);
    let end_number = head_block_number;
    let qps = config.block_sync.sync_per_sec;
    if(end_number - last_head_block_number > qps){
      end_number = last_head_block_number + qps;
    }
    end_number -= pending_sync_count;
    for(let i=last_head_block_number+1; i<=end_number; i++){
      pending_sync_count++;
      requestBlockData(i);
      last_head_block_number = i;
    }
    db_set_global_properties("last_sync_head_block_number", last_head_block_number);
  }, 1000);
}

module.exports = {
    start_sync : start_sync_func
}