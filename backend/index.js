const contract_log_sync = require("./chain/contract_log_sync.js");
const httpservice = require("./rpc/httpservice.js");

contract_log_sync.start_sync();
httpservice.start();