const axios = require('axios');
const mqtt = require('mqtt');

const mqttClient = mqtt.connect('mqtt://localhost:1883');


function getAllItems() {
    axios.get('http://localhost:8080/rest/items')
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

function getItem(itemName: string) {
    axios.get('http://localhost:8080/rest/items/' + itemName)
        .then(
            (res: any) => {
                    console.log('Response ended: ');
                    console.log(res.data);
                    console.log(itemName + ' => ' + JSON.stringify(res.data));
                    mqttClient.publish(itemName, JSON.stringify(res.data));
            }
        ).catch((error: any) => {
            console.log(error);
        });
}

function setItem(itemName: string, message: string) {
    axios.post('http://localhost:8080/rest/items/' + itemName, message)
        .catch((error: any) => {
            console.log(error);
        });
}

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker.');
});

mqttClient.on('message', (rawTopic : any, rawMsg : any) => {
    let topic: string = rawTopic.toString();
    let msg: string = rawMsg.toString();
    console.log(topic + ' <= ' + msg);

    if (msg == "GET") {
        getItem(topic);
    } else {
        setItem(topic, msg);
    }
});

setInterval(
    () => {
        if (mqttClient) getAllItems();
    },
    10000
);