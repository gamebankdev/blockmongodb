const Router = require("koa-router");
const router = new Router();
const config = require("config").get("Config");
const mongodb_promise = require("./../mongodb/mongodb_promise");
const mongodb = new mongodb_promise();

router.get("/getcontractlog/:contract_name/:key/:page_index", async ctx => {
  const page_size = 50;
  //console.log("contract_name:",ctx.params.contract_name,"key",ctx.params.key,"page_index",ctx.params.page_index);
  var sort = {};
  if(ctx.params.sort != null && ctx.params.sort != undefined && ctx.params.order != null && ctx.params.order != undefined) {
    sort[ctx.params.sort] = Number(ctx.params.order);
  }
  console.log(sort);
  var result = await mongodb.find_page(ctx.params.contract_name, {key:ctx.params.key}, sort, ctx.params.page_index, page_size);
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
  mongodb.connect(config.mongo.url, "contract_log");
}

module.exports = router;
module.exports.start = start;
