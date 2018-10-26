const Router = require("koa-router");
const router = new Router();
const config = require("config").get("Config");
const mongodb_promise = require("./../mongodb/mongodb_promise");
const mongodb = new mongodb_promise();

router.get("/getcontractlog/:contract_name/:key/:page_index", async ctx => {
  const page_size = 50;
  //console.log("contract_name:",ctx.params.contract_name,"key",ctx.params.key,"page_index",ctx.params.page_index);
  var result = await mongodb.find_page(ctx.params.contract_name, {key:ctx.params.key}, {}, ctx.params.page_index, page_size);
  ctx.body = {
    code: 200,
    data: {
      result: result
    },
    success: true
  };
  ctx.status = 200;
});

const start = () => {
  mongodb.connect(config.mongo.uri, "contract_log");
}

module.exports = router;
module.exports.start = start;
