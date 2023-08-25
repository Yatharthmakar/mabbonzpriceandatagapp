// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import shopify from "./shopify.js";
import productTagUpdate from "./backend/product-tag-updator.js";
import productFetchor from "./backend/product-fetch.js";
import productPriceUpdate from "./backend/product-price-updator.js";
import GDPRWebhookHandlers from "./gdpr.js";
import { insertUserData, getLogs, deleteLogs, deleteLog, getRunning, updateRunning, getChats, setChats } from "./backend/dbConnection.js";
// import addUninstallWebhookHandler from "./webhooks/appUinstall.js";


const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);


const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling

app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);


// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());



//------------------------------------------------------
// addUninstallWebhookHandler();

app.get("/api/fetchStoreData", async (_req, res) => {
  try {
    const storeData = await shopify.api.rest.Shop.all({ session: res.locals.shopify.session });
    await insertUserData(storeData.data[0]);
    // console.log("store info", storeData.data);
    res.status(200).send({ "response": "Success" });
  }
  catch (err) {
    console.log("Store Data Fecth error", err);
  }
});

app.get("/api/productFetch", async (req, res) => {
  try {
    const response = await productFetchor(res.locals.shopify.session);
  }
  catch (err) {
    console.log(err);
  }
  res.status(200).send({ "response": "Success" });
});

app.patch("/api/updateTagProduct", async (_req, res) => {
  try {
    await productTagUpdate(res.locals.shopify.session, _req.body);
  } catch (err) {
    console.log("Tag Update Fail", err);
  }
  res.status(200).send({ "response": "Success" });
});

app.patch("/api/updatePriceProduct", async (_req, res) => {
  try {
    await productPriceUpdate(res.locals.shopify.session, _req.body);
  } catch (err) {
    console.log("Price Update Fail", err);
  }
  res.status(200).send({ "response": "Success" });

});

app.get("/api/getRunningstatus", async (_req, res) => {
  const response = await getRunning(res.locals.shopify.session);
  res.json(response);
});

app.get("/api/fetchLogsRefresh", async (_req, res) => {
  try {
    const response = await getLogs(res.locals.shopify.session);
    res.json(response[0].logs);
  }
  catch (err) {
    console.log("Failed logs refresh fetch", err);
  }
});

app.delete("/api/deleteLogs", async (_req, res) => {
  try {
    deleteLogs(res.locals.shopify.session);
    res.sendStatus(200);
  }
  catch (err) {
    console.log("Failed logs refresh fetch", err);
  }
});

app.delete("/api/deleteLog", async (_req, res) => {
  try {
    deleteLog(_req.body.start_time, res.locals.shopify.session);
    res.sendStatus(200);
  }
  catch (err) {
    console.log("Error deleting log", err)
  }
});

app.get("/api/getChats", async (req, res) => {
  try {
    const response = await getChats(res.locals.shopify.session);
    res.json(response);
  }
  catch (err) {
    console.log("Getting chat error", err);
  }
});

app.post("/api/setChats", async (req, res) => {
  try {
    const response = await setChats(req.body, res.locals.shopify.session);
    res.send({ "response": "Success" });
  }
  catch (err) {
    console.log("Setting chat error", err);
  }
});


//------------------------------------------------------


app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});


app.listen(PORT);
