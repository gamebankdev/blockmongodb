const Router = require("koa-router");
const router = new Router();
const config = require("config").get("Config");
const mongodb_promise = require("./../mongodb/mongodb_promise");
const mongodb = new mongodb_promise();
router.get("/contractlog/find/:contract_name/:key/:page_index", async ctx => {
  const page_size = 50;
  var sort = {};
  if (
    ctx.query.sort != null &&
    ctx.query.sort != undefined &&
    ctx.query.order != null &&
    ctx.query.order != undefined
  ) {
    sort[ctx.query.sort] = Number(ctx.query.order);
  }
  var result = await mongodb.find_page(
    ctx.params.contract_name,
    { key: ctx.params.key },
    sort,
    ctx.params.page_index,
    page_size
  );
  ctx.body = {
    code: 200,
    data: result,
    success: true
  };
  ctx.status = 200;
});

router.get(
  "/contractlog/findbycol/:contract_name/:colname/:colvalue/:page_index",
  async ctx => {
    const page_size = 50;
    //console.log("contract_name:",ctx.params.contract_name,"colname",ctx.params.colname);
    var sort = {};
    if (
      ctx.params.sort != null &&
      ctx.params.sort != undefined &&
      ctx.params.order != null &&
      ctx.params.order != undefined
    ) {
      sort[ctx.params.sort] = Number(ctx.params.order);
    }
    //console.log(sort);
    var query = {};
    query[ctx.params.colname] = ctx.params.colvalue;
    var result = await mongodb.find_page(
      ctx.params.contract_name,
      query,
      sort,
      ctx.params.page_index,
      page_size
    );
    ctx.body = {
      code: 200,
      data: result,
      success: true
    };
    ctx.status = 200;
  }
);
router.get("/contractlog/count/:contract_name/:key", async ctx => {
  var result = await mongodb.count(ctx.params.contract_name, {
    key: ctx.params.key
  });
  ctx.body = {
    code: 200,
    data: result,
    success: true
  };
  ctx.status = 200;
});
//查询用户下面的记录条数
router.get("/contractlog/count/:userName/:contract_name/:key", async ctx => {
  const {userName,contract_name,key}=ctx.params
  var result = await mongodb.count(contract_name, {
    key: key,
    col4: { $all: [userName] }
  });
  ctx.body = {
    code: 200,
    data: result,
    success: true
  };
  ctx.status = 200;
});

//查询用户的记录
router.get(
  "/contractlog/find/:contract_name/:userName/:key/:page_index",
  async ctx => {
    const { sort, order } = ctx.query;
    const { userName, contract_name, key, page_index } = ctx.params;
    try {
      result = await mongodb.find_page(
        contract_name,
        { key: key, col4: { $all: [userName] } },
        { [sort]: Number(order) },
        page_index,
        50
      );
      ctx.body = {
        code: 200,
        data: result,
        success: true
      };
      ctx.status = 200;
    } catch (err) {
      ctx.body = {
        success: false,
        code: 500,
        message: err.message
      };
      ctx.status = 500;
    }
  }
);
const start = async () => {
  await mongodb.connect(
    config.mongo.url,
    config.contract_sync.contract_log_db,
    { autoReconnect: true, keepAlive: true }
  );
  //console.log("1",mongodb.mongo_db)
  //console.log("mongodb2",mongodb);
};

module.exports = router;
module.exports.start = start;
