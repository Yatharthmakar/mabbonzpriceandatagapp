import shopify from "../shopify.js";
import { GraphqlQueryError } from "@shopify/shopify-api";
import axios from "axios";
import {setSkuMap} from "./dbConnection.js";
// import JSONL from "jsonl-parse-stringify";

let map = {};
let products_sku={};
export default async function productFetchor(session, storeName){

    const client = new shopify.api.clients.Graphql({ session });
    try{
        const client = new shopify.api.clients.Graphql({ session });
        const response = await client.query({
        data: `mutation {
            bulkOperationRunQuery(
             query: """
              {
                products {
                  edges {
                    node {
                      id
                      tags
                      variants {
                        edges{
                            node{
                                sku
                                id
                            }
                        } 
                      }
                    }
                  }
                }
              }
              """
            ) {
              bulkOperation {
                id
                status
              }
              userErrors {
                field
                message
              }
            }
          }`          
        });

        let pollResponse = {'body':{'data':{'currentBulkOperation':{'status': "RUNNING"}}}};
        const pollFunc = async ()=>{
            pollResponse = await client.query({
                data: `query {
                    currentBulkOperation {
                      id
                      status
                      errorCode
                      url
                    }
                  }
                  `          
                });
        }

        const interval = setInterval(async()=>{
            if(pollResponse.body.data.currentBulkOperation.status === "COMPLETED"){
                clearInterval(interval);
                console.log("done bulk fetch", storeName);
                // console.log(pollResponse.body.data.currentBulkOperation.url);
                return await skuMatch(pollResponse.body.data.currentBulkOperation.url,storeName);   
            }
            else{
                pollFunc();
            }         
        },1000);
              
    }
     catch (error) {
    if (error instanceof GraphqlQueryError) {
      throw new Error(
        `${error.message}\n${JSON.stringify(error.response, null, 2)}`
      );
    } else {
      throw error;
    }
  }
}

async function skuMatch(url,storeName){
    try {
        const response = await axios.get(url);
        // console.log(response.data);
        const lines = response.data.split('\n');
        let previous;
        lines.forEach((line, index)=>{
            if(line !=""){
                let lin = JSON.parse(line);
                if(lin.sku){
                    map[`${lin.sku}`] = { "id": `${lin.id}`, "productid": `${previous.id}`};
                    // console.log(map[`${lin.sku}`]);
                    // console.log("previous", previous);
                }
                else{
                    previous = {"id": `${lin.id}`};
                    products_sku[`${lin.id}`] = {"tags": `${lin.tags}`, "id": `${lin.id}`}
                }
            }
        });
        
      } catch (error) {
        console.error('Error downloading JSONL file:', error);
        throw error;
      }

      setSkuMap(map, products_sku, storeName);
      return map;
}

export {map};
