const axios = require('axios');
const mqtt = require('mqtt');
var EventSource = require('eventsource');

const hostIP: string = '192.168.1.22';
const mqttClient = mqtt.connect('mqtt://' + hostIP + ':1883');
let es: any = new EventSource('http://' + hostIP + ':8080/rest/events?topics=openhab/items');
subscribeToSSE();


/**
 * Subscribes to all the MQTT topics associated with all the items OpenHAB returns.
 */
function getAllItems() {
    axios.get(
            'http://' + hostIP + ':8080/rest/items',
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
            'http://' + hostIP + ':8080/rest/items/' + itemName,
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
            'http://' + hostIP + ':8080/rest/items/' + itemName,
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

function subscribeToSSE() {
    es = new EventSource('http://' + hostIP + ':8080/rest/events?topics=openhab/items');

    es.onopen = (event: any) => {
        console.log('Successfully subscribed to OpenHAB\'s SSE.');
    }
    
    es.onmessage = (msg: any) => {
        msg = JSON.parse(msg.data);
    
        let topic: string = msg.topic.toString();
        let topicSplit: string[] = topic.split('/');
    
        if (topicSplit[3] == 'state' && mqttClient) {
            let payload: any = JSON.parse(msg.payload);
            let nameSplit: string[] = topicSplit[2].split('_');

            console.log('Received event :');
            console.log(topic);
            console.log(payload);
    
            if (nameSplit.length == 1) {
                console.log(nameSplit[0] + ' => ' + payload.value);
                mqttClient.publish(nameSplit[0], payload.value);
            } else {
                let name: string = nameSplit[0] + '/';
                for (let i = 1; i < nameSplit.length - 1; i++) {
                    name += nameSplit[i] + '_';
                }
                name += nameSplit[nameSplit.length - 1];
                console.log(name + ' => ' + payload.value);
                mqttClient.publish(name, payload.value);
            }
        }
    }
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

/**
 * This checks every minute if any new item has been added to OpenHAB.
 * If so, it subscribes to the new concerned topics.
 */
setInterval(
    () => {
        if (mqttClient) getAllItems();
        if (es.readyState == 0 || es.readyState == 2) subscribeToSSE();
    },
    60000
);