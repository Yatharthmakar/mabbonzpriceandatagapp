import shopify from "../shopify.js";
import { GraphqlQueryError } from "@shopify/shopify-api";
import { updateStatus, updateRunning, getSkuMap } from "./dbConnection.js";
import currentDate from "./formated-date.js";


const CREATE_PRODUCT_VARIANT_PRICE_MUTATION = `mutation 
productVariantUpdate($input: ProductVariantInput!) {
    productVariantUpdate(input: $input) {
      productVariant {
        id
        price
      }
      userErrors {
        field
        message
      }
    }
  }
  `;

export default async function productPriceUpdate(session, req) {
  const storeName = session.shop.replace('.myshopify.com', '');
  console.log('Price Update', storeName);
  const client = new shopify.api.clients.Graphql({ session });
  const time = currentDate(req.timezone);
  let count = 0;
  let error = false;
  let errorCount = 1;
  const skuMap = await getSkuMap(storeName);
  await updateRunning({ "store_name": storeName, "running": 1 });
  await updateStatus({ "store_name": storeName, "file_name": req.file.name, "start_time": time, "update": "Price Update", "count": 0 });
  try {
    const products = req.file.data;
    const amount = Math.abs(Number(req.amount));
    const percentage = Math.abs(Number(req.percentage));
    for await (const product of products) {
      if (product.sku != '' && product.price != '') {
        errorCount++;
        const prod_sku = product.sku.replace(/^'/,"");
        const variant = skuMap[`${prod_sku}`];
        let price = Number(product.price);
        if (!variant) {
          await updateStatus({ "store_name": storeName, "start_time": time, "error": `SKU not found or wrong SKU at line ${errorCount} ` });
          error = true;
          continue;
        }
        if (!price) {
          await updateStatus({ "store_name": storeName, "start_time": time, "error": `Price not found at line ${errorCount}. Price must be a numeric value` });
          error = true;
          continue;
        }
        else {
          count++;
        }

        if (req.update === "increseprice") {
          if (req.amount) {
            price += amount;
          } else {
            price += price * percentage / 100;
          }
        }
        else if (req.update === "decreseprice") {
          if (req.amount) {
            price -= amount;
          } else {
            price -= price * percentage / 100;
          }
        }
        const data = await client.query({
          data: {
            query: CREATE_PRODUCT_VARIANT_PRICE_MUTATION,
            variables: {
              input: {
                id: `${variant.id}`,
                price: `${price}`,
              },
            },
          },
        });
      }
    };
    await updateStatus({ "store_name": storeName, "start_time": time, "count": count, "finish_time": currentDate(req.timezone), "status": error ? 'Some Fields Ignored' : 'Success' });
    await updateRunning({ "store_name": storeName, "running": 0 });
  }

  catch (error) {
    console.log("product-price-updator.js", error);
    await updateStatus({ "store_name": storeName, "start_time": time, "count": count, "finish_time": currentDate(req.timezone), "status": 'Failed' });
    await updateRunning({ "store_name": storeName, "running": 0 });
  }
}