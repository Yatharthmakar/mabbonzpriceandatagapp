import shopify from "../shopify.js";
import { GraphqlQueryError } from "@shopify/shopify-api";
import { updateStatus, updateRunning, getSkuMap, getProductMap } from "./dbConnection.js";
import currentDate from "./formated-date.js";

export default async function productTagUpdate(session, req) {
  const storeName = session.shop.replace('.myshopify.com',''); 
  console.log('Tag Update', storeName);
  const client = new shopify.api.clients.Graphql({ session });
  const time = currentDate(); 
  let count = 0;
  let error = false;
  let errorCount = 1;
  const skuMap = await getSkuMap(storeName);
  await updateRunning({"store_name": storeName, "running": 1});
  await updateStatus({ "store_name": storeName, "file_name": req.file.name, "start_time": time, "update": "Tag Update", "count": 0});
  try {
    const products = req.file.data;
    if (req.update === "replacetags") {
      for await (const product of products) {
        errorCount++;
        const prod_sku = product.sku.replace("'","");
        const prod = skuMap[`${prod_sku}`];
        if (!prod) {
          await updateStatus({ "store_name": storeName, "start_time": time, "error": `SKU not found or wrong SKU at line ${errorCount}` });
          error = true;
          continue;
        } 
        else if(product.tags === '' || !product.tags){
          await updateStatus({ "store_name": storeName, "start_time": time, "error": `Tag not found at line ${errorCount}` });
          error = true;
          continue;
        }
        else {
          count++;
        }
        const data = await client.query({
          data: `mutation {
                    productUpdate(input: {id: "${prod.productid}", tags: "${product.tags}"}) {
                        product {
                          id
                        }
                      }
                  }`,
        });
      };
      await updateStatus({ "store_name": storeName, "start_time": time, "count": count, "status": error ? 'Some Fields Ignored' : 'Success' });
      await updateRunning({"store_name": storeName, "running": 0});
    }
    else if (req.update === "addtags") {
      for await (const product of products) {
        errorCount++;
        const prod_sku = product.sku.replace("'","");
        const prod = skuMap[`${prod_sku}`];
        if (!prod) {
          await updateStatus({ "store_name": storeName, "start_time": time, "error": `SKU not found or wrong SKU at line ${errorCount}` });
          error = true;
          continue;
        }
        else if(product.tags === '' || !product.tags){
          await updateStatus({ "store_name": storeName, "start_time": time, "error": `Tag not found at line ${errorCount}` });
          error = true;
          continue;
        }
         else {
          count++;
        }
        const data = await client.query({
          data: `mutation {
              tagsAdd(id: "${prod.productid}", tags: "${product.tags}") {
                        node {
                          id
                        }
                      }
                  }`,
        });
      };
      await updateStatus({ "store_name": storeName, "start_time": time, "count": count, "status": error ? 'Some Fields Ignored' : 'Success' });
      await updateRunning({"store_name": storeName, "running": 0});
    }
    else if (req.update === "deletetagfromall") {
      const productMap = await getProductMap(storeName);
      for await (const product of products){
        for (let key in productMap){
          errorCount++;
          if (product.data) {
            await updateStatus({ "store_name": storeName, "start_time": time, "error": `Tag not found at line ${errorCount}` });
            error = true;
            continue;
          } else {
            count++;
          }
          const prod = productMap[key];
          if (prod.tags.includes(product.data)) {
            const data = await client.query({
              data: `mutation {
                  tagsRemove(id: "${key}", tags: "${product.data}") {
                            node {
                              id
                            }
                          }
                      }`,
            });
          }
        };
      }
      await updateStatus({ "store_name": storeName, "start_time": time, "count": count, "status": error ? 'Some Fields Ignored' : 'Success' });
      await updateRunning({"store_name": storeName, "running": 0});
    }
    else if (req.update === "replacefromall") {
      const productMap = await getProductMap(storeName);
      for await (const product of products){
        for (let key in productMap){
          errorCount++;
          if (!product.oldtags || !product.tags || product.tags=== '' || product.oldtags === '') {
            await updateStatus({ "store_name": storeName, "start_time": time, "error": `Tag not found at line ${errorCount}` });
            error = true;
            continue;
          } else {
            count++;
          }
          const prod = productMap[key];
          if (prod.tags.includes(product.oldtags)) {
            const data = await client.query({
              data: `mutation {
                  tagsRemove(id: "${key}", tags: "${product.oldtags}") {
                            node {
                              id
                            }
                          }
                      }`,
            });
            const data1 = await client.query({
              data: `mutation {
                  tagsAdd(id: "${key}", tags: "${product.tags}") {
                            node {
                              id
                            }
                          }
                      }`,
            });
          }
        };
      }
      await updateStatus({ "store_name": storeName, "start_time": time, "count": count, "status": error ? 'Some Fields Ignored' : 'Success' });
      await updateRunning({"store_name": storeName, "running": 0});
    }
    else if (req.update === "deleteallfromsku") {
      for await (const product of products) {
        errorCount++;
        const prod_sku = product.sku.replace("'","");
        const prod = skuMap[`${prod_sku}`];
        if (!prod) {
          await updateStatus({ "store_name": storeName, "start_time": time, "error": `SKU not found or wrong SKU at line ${errorCount}` });
          error = true;
          continue;
        } else {
          count++;
        }
        const data = await client.query({
          data: `mutation {
                    productUpdate(input: {id: "${prod.productid}", tags: ""}) {
                        product {
                          id
                        }
                      }
                  }`,
        });
      };
      await updateStatus({ "store_name": storeName, "start_time": time, "count": count, "status": error ? 'Some Fields Ignored' : 'Success' });
      await updateRunning({"store_name": storeName, "running": 0});
    }
  }
  catch (error) {
      console.log("product-tag-updator.js",error);
      await updateStatus({ "store_name": storeName, "start_time": time, "count": count, "status":'Failed' });
      await updateRunning({ "store_name": storeName, "running": 0 });
  }
}