const gamebank = require("gamebank");
const fs = require("fs");
const request = require("axios");
const config = require("config").get("Config");
const mongodb_promise = require("./../mongodb/mongodb_promise");
const mongodb = new mongodb_promise();

var last_head_block_number = 0;
var pending_sync_count = 0;
var error_block_nums = [];

gamebank.api.setOptions({ url: config.gamebank.server });
gamebank.config.set("address_prefix", config.gamebank.address_prefix);
gamebank.config.set("chain_id", config.gamebank.chain_id);

const db_get_global_properties = async (property_name,) => {
  var property_value = await mongodb.findOne("__global_properties__", {'name':property_name});
  return property_value;
}

const db_set_global_properties = async (property_name, property_value) => {
  var result = await mongodb.replaceOne("__global_properties__", {'name':property_name}, {'name':property_name, 'value':property_value}, {upsert:true});
  return result;
}

// 获取区块数据
const requestBlockData = async (block_num) => {
  // console.log(block_num)
  try {
    var formData = {
      id: 0,
      jsonrpc: "2.0",
      method: "call",
      params: ["condenser_api", "get_block", [block_num]]
    };
    const { data = {} } = await request({
      url: config.gamebank.server,
      method: "POST",
      data: formData,
      headers: {
        "Content-type": "application/json"
      }
    });
   
    let result = data.result;
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
            console.log(from,"->",to,amount,transaction_id);
            if(to == "center_wallet"){
              console.log(from,"->",to,amount,transaction_id); // todo
            }
            let insert_obj = {transaction_id:transaction_id, from:from, to:to, amount:amount, memo:memo};
            var ret = await mongodb.insertOne("transfer", insert_obj);
          }
          catch(e){
            //console.log("exception", e);
            //console.log(from,"->",to,amount,transaction_id);
            console.log("sync blockerror1 block_num", block_num, "pending_sync_count", pending_sync_count,"transactionIndex",transactionIndex);
            pending_sync_count--;
            fs.appendFile("./log/blockerr.log", block_num+" "+transactionIndex+" "+transaction_id+"\n");
            error_block_nums.push({block_num:block_num, transactionIndex:transactionIndex});
            return false;
          }
        }
      });
    });
    // var ret = await db_set_global_properties("last_sync_head_block_number", block_num);
    //last_head_block_number = block_num;
    if((block_num%1000) == 0){
      console.log("block_log block_num", block_num);
    }
    pending_sync_count--;
    return true;
  } catch (err) {
    // todo: 错误的block记录一下
    //request_head_block_number(read_file_contract_number());
    console.log("sync blockerror2 block_num", block_num, "pending_sync_count", pending_sync_count);
    //console.log("err", err);
    fs.appendFile("./log/blockerr.log", block_num+"\n");
    pending_sync_count--;
    error_block_nums.push({block_num:block_num, transactionIndex:-1});
    return false;
  }
}

const start_sync_func = async () => {
  var db = await mongodb.connect(config.mongo.url, "block_log", {autoReconnect:true,keepAlive:true});
  await mongodb.createIndex("transfer",{transaction_id:1}, {unique:true});
  var last_sync_head_block_number = await db_get_global_properties("last_sync_head_block_number");
  if(last_sync_head_block_number == null ) {
    last_sync_head_block_number = {'name':"last_sync_head_block_number", 'value':0};
  }
  console.log("block_log last_sync_head_block_number", last_sync_head_block_number.value);
  last_head_block_number = last_sync_head_block_number.value;

  setInterval(async () => {
    for(let i=error_block_nums.length-1,j=0; i>=0 && j<config.block_sync.resync_per_sec; i--,j++){
      console.log("resync block_log",error_block_nums[i].block_num);
      if( requestBlockData(error_block_nums[i].block_num) == false){
        break;
      }
      error_block_nums.splice(i,1);
      pending_sync_count++;
    }

    const { head_block_number } = await gamebank.api.getDynamicGlobalPropertiesAsync();
    //console.log("get head_block_number",head_block_number,"last_head_block_number",last_head_block_number);
    let end_number = head_block_number;
    let qps = config.block_sync.sync_per_sec/3;
    if(end_number - last_head_block_number > qps){
      end_number = last_head_block_number + qps;
    }
    end_number -= pending_sync_count;
    for(let i=last_head_block_number+1; i<=end_number; i++){
      if( requestBlockData(i) == false){
        break;
      }
      pending_sync_count++;
      last_head_block_number = i;
    }
    var ret = await db_set_global_properties("last_sync_head_block_number", last_head_block_number);
  }, 3000);
}

module.exports = {
    start_sync : start_sync_func
}