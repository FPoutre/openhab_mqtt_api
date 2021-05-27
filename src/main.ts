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
                    mqttClient.subscribe(item.name.replace('_', '/'));
                });
                console.log('Successfully updated MQTT topic subscriptions.');
            }
        )
        .catch((error: any) => {
            console.log('An error occurred during MQTT subscriptions\' update :');
            console.log(error);
        });
}

/**
 * Gets an item's data from OpenHAB's REST API.
 * @param itemName The name of the item to get from OpenHAB's REST API
 */
function getItem(topic: string) {
    axios.get(
            'http://' + hostIP + ':8080/rest/items/' + topic.replace('/', '_'),
            {
                headers: {
                    'Accept': 'application/json'
                }
            })
        .then(
            (res: any) => {
                console.log('Response ended: ');
                console.log(res.data);
                console.log(topic + ' => ' + JSON.stringify(res.data));
                mqttClient.publish(topic + '/response', JSON.stringify(res.data));
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
function setItem(topic: string, message: string) {
    axios.post(
            'http://' + hostIP + ':8080/rest/items/' + topic.replace('/', '_'),
            message,
            {
                headers: {
                    'Content-Type': 'text/plain',
                    'Accept': 'application/json'
                }
            })
        .then(
            (res: any) => {
                console.log('Item set successfully.');
            }
        )
        .catch((error: any) => {
            console.log(error);
        });
}

/**
 * Subcribes to OpenHAB's Server-Sent Events through a GET request on /rest/events.
 * The 'topics' parameter indicates that we're only interested in Items.
 */
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
            let name: string = topicSplit[2].replace('_', '/');

            console.log('Received event :');
            console.log(topic);
            console.log(payload);
    
            console.log(name + ' => ' + payload.value);
            mqttClient.publish(name, payload.value);
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
 * It also checks if the SSE connection is healthy. It will try to reconnect if not.
 */
setInterval(
    () => {
        if (mqttClient) {
            console.log('Refreshing MQTT topic subscriptions...');
            getAllItems();
        }
        if (es.readyState == 0 || es.readyState == 2) {
            console.log('Connection to OpenHAB\'s SSE lost. Retrying...');
            subscribeToSSE();
        }
    },
    60000
);