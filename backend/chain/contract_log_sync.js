const gamebank = require("gamebank");
const fs = require("fs");
const request = require("axios");
const config = require("config").get("Config");
const mongodb_promise = require("./../mongodb/mongodb_promise");
const mongodb = new mongodb_promise();

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

//请求链上最新的区块
const request_head_block_number = async read_head_block_number => {
    const {
      head_block_number
    } = await gamebank.api.getDynamicGlobalPropertiesAsync();
    global.last_head_block_number = head_block_number;
  
    requestBlockChain(read_head_block_number);
  
    global.timer = setInterval(async () => {
      const {
        head_block_number
      } = await gamebank.api.getDynamicGlobalPropertiesAsync();
  
      global.last_head_block_number = head_block_number;
      requestBlockChain(head_block_number);
    }, 3000);
  };

  //获取当前最新的初始合约块信息
const requestBlockChain = async head_block_number => {
    //console.log(head_block_number)
    try {
      if (head_block_number > global.last_head_block_number) {
        return false;
      }
      var formData = {
        id: 0,
        jsonrpc: "2.0",
        method: "call",
        params: ["condenser_api", "get_contract", [head_block_number]]
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
  
      transactions.forEach(ele => {
        const { operations = [] } = ele;
          operations.forEach(async (value = []) => {
            const [contract_log, info] = value;
            if (contract_log == "contract_log") {
              const { name,key,data = JSON.stringify({}) } = info; // name:contract_name
              try {
                const value = JSON.parse(data); // data: array
                console.log(name,key,value);
                let insert_obj = {key:key, block_number:head_block_number};
                for(var i=0; i<value.length; i++){
                  insert_obj["col"+(i+1)] = value[i];
                }
                var ret = await mongodb.insert(name, insert_obj);
              }
              catch(e){
                console.log("exception", e);
                console.log("name", name);
                console.log("data", data);
              }
            }
          });
      });
      var ret = await db_set_global_properties("last_sync_head_block_number", head_block_number);
      return requestBlockChain(head_block_number + 1);
    } catch (err) {
      //request_head_block_number(read_file_contract_number());
      fs.writeFileSync("./file/err.txt", JSON.stringify(err));
      console.log("err", err);
    }
  };

const start_sync_func = async () => {
  var db = await mongodb.connect(config.mongo.url, "contract_log", {autoReconnect:true,keepAlive:true});
  var last_sync_head_block_number = await db_get_global_properties("last_sync_head_block_number");
  if(last_sync_head_block_number == null ) {
    last_sync_head_block_number = {'name':"last_sync_head_block_number", 'value':0};
  }
  console.log("last_sync_head_block_number", last_sync_head_block_number.value);
  request_head_block_number(last_sync_head_block_number.value+1);
}

module.exports = {
    start_sync : start_sync_func
}