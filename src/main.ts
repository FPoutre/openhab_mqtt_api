const axios = require('axios');
const mqtt = require('mqtt');
var EventSource = require('eventsource');

const hostIP: string = '192.168.1.22';
const mqttClient = mqtt.connect('mqtt://' + hostIP + ':1883');
let es: any = new EventSource('http://' + hostIP + ':8080/rest/events?topics=openhab/items');
subscribeToSSE();


/**
 * Converts a MQTT topic to an OpenHAB's Item's name.
 * MQTT topics are formatted this way : type/item/channel
 * OpenHAB's Items' names are formatted this way : item_channel
 * @param topic The topic to be converted to an Item's name
 * @returns The converted Item's name
 */
function topicToName(topic: string) {
    // Gets to this format : item/channel
    let name: string = topic.slice(topic.indexOf('/') + 1, topic.length);
    // Returns : item_channel
    return name.replace('/', '_');
}

/**
 * Converts an OpenHAB's Item's name to a MQTT topic.
 * MQTT topics are formatted this way : sensors/item/channel
 * OpenHAB's Items' names are formatted this way : item_channel
 * @param type The type of item. Either a sensor or an actuator
 * @param name The OpenHAB's item name to be converted to an MQTT topic
 * @returns The converted MQTT topic
 */
function nameToTopic(type: string, name: string) {
    // Formats to : item/channel
    let topic: string = name.replace('_', '/');
    // Returns : type/item/channel
    return type + '/' + topic;
}

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
                    if ('readOnly' in item && item.readOnly) {
                        mqttClient.subscribe(nameToTopic('sensors', item.name));
                    } else if ('writeOnly' in item && item.writeOnly) {
                        mqttClient.subscribe(nameToTopic('actuators', item.name));
                    } else {
                        mqttClient.subscribe(nameToTopic('sensors', item.name));
                        mqttClient.subscribe(nameToTopic('actuators', item.name));
                    }
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
function getItem(name: string) {
    axios.get(
            'http://' + hostIP + ':8080/rest/items/' + name,
            {
                headers: {
                    'Accept': 'application/json'
                }
            })
        .then(
            (res: any) => {
                console.log('Response ended: ');
                console.log(res.data);
                console.log(nameToTopic('sensors', name) + ' => ' + res.data.state);
                mqttClient.publish(nameToTopic('sensors', name), res.data.state);
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
function setItem(name: string, message: string) {
    axios.post(
            'http://' + hostIP + ':8080/rest/items/' + name,
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
    
        let name: string = msg.topic.toString().split('/')[2];
        let isState: boolean = msg.topic.toString().split('/')[3] == 'state';
    
        if (isState && mqttClient) {
            let payload: any = JSON.parse(msg.payload);
            let topic: string = nameToTopic('sensors', name);

            console.log('Received event :');
            console.log(name);
            console.log(payload);
    
            console.log(topic + ' => ' + payload.value);
            mqttClient.publish(topic, payload.value);
        }
    }
}

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker.');
    getAllItems();
});

mqttClient.on('message', (rawTopic : any, rawMsg : any) => {
    let topic: string = rawTopic.toString();
    let type: string = topic.slice(0, topic.indexOf('/'));
    let msg: string = rawMsg.toString();

    // Checks if either the MQTT Client wishes to get the item's data, or wishes to change the item's state.
    if (type == 'sensors' && msg == 'GET') {
        console.log(rawTopic.toString() + ' <= ' + msg);
        getItem(topicToName(topic));
    } else if (type == 'actuators') {
        console.log(rawTopic.toString() + ' <= ' + msg);
        setItem(topicToName(topic), msg);
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