import { MongoClient } from "mongodb";
import currentDate from "./formated-date.js";
const url = "mongodb+srv://ranbirr314:gszC63K4Ytrl1Ogn@cluster0.na64i4d.mongodb.net/?retryWrites=true&w=majority";
const mdbclient = new MongoClient(url);

async function userData() {
    const result = await mdbclient.connect();
    const db = result.db('customers');
    return db.collection('userdata');
};

async function insertProductData() {
    const result = await mdbclient.connect();
    const db = result.db('priceandtagapp');
    return db.collection('skuidmap');
};

async function insertLogData() {
    const result = await mdbclient.connect();
    const db = result.db('priceandtagapp');
    return db.collection('logsdata');
};

async function chats() {
    const result = await mdbclient.connect();
    const db = result.db('priceandtagapp');
    return db.collection('chats');
};

const updateUninstall = async (storeName) => {
    const db = await userData();
    await db.updateOne({ "store_data.domain": storeName }, { $set: { uninstalled_at: currentDate() } });
}

const setSkuMap = async (data, productSku, storeName) => {
    const db = await insertProductData();
    const db2 = await insertLogData();
    const db3 = await chats();
    const response = await db.find({ "name": storeName }).toArray();
    try {
        if (response.length === 0) {
            await db.insertOne({ "name": storeName, "sku_map": data, "product_sku": productSku, "running": 0 });
            await db2.insertOne({ "name": storeName, "logs": [] });
            await db3.insertOne({ "name": storeName, "chats": [] });
            console.log("Data Inserted");
        }
        else {
            await db.updateOne({ "name": storeName }, { $set: { "sku_map": data, "product_sku": productSku } })
            console.log("Data Updated", storeName);
        }
    }
    catch (err) {
        console.log(err);
    }
};

const getChats = async (session) => {
    const storeName = session.shop.replace('.myshopify.com','');
    console.log("get chats", storeName);
    const db = await chats();
    const response = await db.find({ "name": storeName }).toArray();
    return response[0].chats;
};

const setChats = async (data, session) => {
    const storeName = session.shop.replace('.myshopify.com','');
    console.log("set chats", storeName);
    const db = await chats();
    await db.updateOne({ "name": storeName }, { $push: { "chats": { "message": data.message, "time": currentDate(), "sender": storeName } } });
};

const updateRunning = async (data) => {
    try {
        console.log("running update", data.running, data.store_name);
        const db = await insertProductData();
        await db.updateOne({ "name": data.store_name }, { $set: { "running": data.running } });
    }
    catch (err) {
        console.log(err);
    }
}

const getRunning = async (session) => {
    try {
        const storeName = session.shop.replace('.myshopify.com', '');
        console.log("get running status", storeName);
        const db = await insertProductData();
        const response = await db.find({ "name": storeName }).toArray();
        return response[0].running;
    }
    catch (err) {
        console.log(err);
    }
}

const updateStatus = async (data) => {
    const db = await insertLogData();
    try {
        const response = await db.find({ "name": data.store_name, "logs.start_time": data.start_time }).toArray();
        if (response.length === 0) {
            console.log("inserted file status", data.store_name);
            await db.updateOne({ "name": data.store_name }, { $push: { "logs": { $each: [{ "start_time": data.start_time, "finish_time": "Running", "file_name": data.file_name, "status": "Pending", "update": data.update, "count": data.count, "error": { "count": 0, "message": [] } }], $position: 0 } } });
        }
        else if (data.error) {
            console.log("update error", data.store_name);
            await db.updateOne({ "name": data.store_name, "logs.start_time": data.start_time }, { $set: { "logs.$.count": data.count }, $inc: { "logs.$.error.count": 1 }, $push: { "logs.$.error.message": data.error } });
        }
        else {
            console.log("updated file status", data.store_name);
            await db.updateOne({ "name": data.store_name, "logs.start_time": data.start_time }, { $set: { "logs.$.finish_time": currentDate(), "logs.$.status": data.status, "logs.$.count": data.count } });
        }
    } catch (err) {
        console.log("Mongo error", err);
    }
};

const deleteLog = async (data, session) => {
    try {
        const storeName = session.shop.replace('.myshopify.com', '');
        console.log('Deleted single Logs', storeName);
        const db = await insertLogData();

        await db.updateOne({ "name": storeName }, { $pull: { "logs": { "start_time": data } } });
    }
    catch (err) {
        console.log("Mongo error", err);
    }
};

const getLogs = async (session) => {
    const storeName = session.shop.replace('.myshopify.com', '');
    console.log('Logs fetch refresh', storeName);
    const db = await insertLogData();
    const response = await db.find({ "name": storeName, }, { "logs": 1 }).toArray();
    return response;
};

const deleteLogs = async (session) => {
    const storeName = session.shop.replace('.myshopify.com', '');
    console.log('Deleted All Logs', storeName);
    const db = await insertLogData();
    await db.updateOne({ "name": storeName }, { $set: { "logs": [] } });
};

const getSkuMap = async (storeName) => {
    const db = await insertProductData();
    const response = await db.find({ "name": storeName }).toArray();
    console.log('Fetched from database', storeName);
    return response[0].sku_map;
};

const getProductMap = async (storeName) => {
    const db = await insertProductData();
    const response = await db.find({ "name": storeName }).toArray();
    console.log('Fetched from database', storeName);
    return response[0].product_sku;
};

const insertUserData = async (data) => {
    const db = await userData();
    const response = await db.find({ "store_data.name": data.name }).toArray();
    if (response.length === 0) {
        console.log("inserted user data", data.name);
        await db.insertOne({ "store_data": data, "installed_at": currentDate(), "last_used": currentDate(), "uninstalled_at": "-" });
    } else {
        console.log("updated user data", data.name);
        await db.updateOne({ "store_data.name": data.name }, { $set: { last_used: currentDate(), "uninstalled_at": "-" } });
    }
};

export { insertUserData, setSkuMap, getSkuMap, getProductMap, updateStatus, getLogs, deleteLogs, deleteLog, updateRunning, getRunning, updateUninstall, getChats, setChats };
