const axios = require('axios');
const mqtt = require('mqtt');

const mqttClient = mqtt.connect('mqtt://localhost:1883');


function getAllItems() {
    axios.get('http://localhost:8080/rest/items')
        .then(
            (res: any) => {
                let data: any[] = [];

                res.on('data', (chunk: any) => {
                    data.push(chunk);
                });
                
                res.on('end', () => {
                    let allItems: any = JSON.parse(Buffer.concat(data).toString());

                    allItems.forEach((item: any) => {
                        mqttClient.subscribe(item.name);
                    });
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
                let data: any[] = [];

                res.on('data', (chunk: any) => {
                    data.push(chunk);
                });
                
                res.on('end', () => {
                    console.log('Response ended: ');
                    let json: any = JSON.parse(Buffer.concat(data).toString());
                    console.log(json);
                    console.log(itemName + ' => ' + json);
                    mqttClient.publish(itemName, json);
                });
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
    console.log(topic, ' <= ', msg);

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