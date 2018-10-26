const Koa = require("koa");
const app = new Koa();
const koaBody = require("koa-body");
const cors = require("koa2-cors");

const config = require("config").get("Config");
const httpapi = require("./httpapi");

const start = () => {
    app
    .use(
        cors({
            origin: "*",
            credentials: true,
            allowMethods: ["GET", "POST"]
        })
    )
    .use(koaBody())
    .use(httpapi.routes())
    .use(httpapi.allowedMethods())
    .listen(config.http.port);

    httpapi.start();
}

module.exports = {
    start : start
}