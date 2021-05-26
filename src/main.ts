const axios = require('axios');
const mqtt = require('mqtt');
const EventSource = require('@joeybaker/eventsource');

const mqttClient = mqtt.connect('mqtt://localhost:1883');


/**
 * Subscribes to all the MQTT topics associated with all the items OpenHAB returns.
 */
function getAllItems() {
    axios.get(
            'http://localhost:8080/rest/items',
            {
                headers: {
                    'Accept': 'application/json'
                }
            })
        .then(
            (res: any) => {
                res.data.forEach((item: any) => {
                    mqttClient.subscribe(item.name);
                });
            }
        )
        .catch((error: any) => {
            console.log(error);
        });
}

/**
 * Gets an item's data from OpenHAB's REST API.
 * @param itemName The name of the item to get from OpenHAB's REST API
 */
function getItem(itemName: string) {
    axios.get(
            'http://localhost:8080/rest/items/' + itemName,
            {
                headers: {
                    'Accept': 'application/json'
                }
            })
        .then(
            (res: any) => {
                    console.log('Response ended: ');
                    console.log(res.data);
                    console.log(itemName + ' => ' + JSON.stringify(res.data));
                    mqttClient.publish(itemName + '/response', JSON.stringify(res.data));
            }
        ).catch((error: any) => {
            console.log(error);
        });
}

/**
 * Sets the state of an item from OpenHAB's REST API.
 * @param itemName The name of the item to get from OpenHAB's REST API
 * @param message The new value that should be passed to OpenHAB's REST API
 */
function setItem(itemName: string, message: string) {
    axios.post(
            'http://localhost:8080/rest/items/' + itemName,
            message,
            {
                headers: {
                    'Content-Type': 'text/plain',
                    'Accept': 'application/json'
                }
            })
        .catch((error: any) => {
            console.log(error);
        });
}

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker.');
    getAllItems();
});

mqttClient.on('message', (rawTopic : any, rawMsg : any) => {
    let topic: string = rawTopic.toString();
    let msg: string = rawMsg.toString();
    console.log(topic + ' <= ' + msg);

    // Checks if either the MQTT Client wishes to get the item's data, or wishes to change the item's state.
    if (msg == "GET") {
        getItem(topic);
    } else {
        setItem(topic, msg);
    }
});

let es: any = new EventSource('http://localhost:8080/rest/events?topics=openhab/items');

es.onmessage = (msg: any) => {
    msg = JSON.parse(msg.data);
    console.log(msg);
}

/**
 * This checks every minute if any new item has been added to OpenHAB.
 * If so, it subscribes to the new concerned topics.
 */
setInterval(
    () => {
        if (mqttClient) getAllItems();
    },
    60000
);