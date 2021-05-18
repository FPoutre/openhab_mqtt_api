const http = require('http');
const mqtt = require('mqtt');

const mqttClient = mqtt.connect('mqtt://localhost:1883');

let allItems: any[] = [];


function getAllItems() {
    http.get(
        'http://localhost:8080/rest/items',
        (res : any) => {
            let data : any[] = [];

            res.on('data', (chunk : any) => {
                data.push(chunk);
            });
            
            res.on('end', () => {
                console.log('Response ended: ');
                let json = JSON.parse(Buffer.concat(data).toString());
                console.log(json);
                allItems = json;
            });
        }
    );
}

function getItem(itemName: string) {
    http.get(
        'http://localhost:8080/rest/items/' + itemName,
        (res : any) => {
            let data : any[] = [];

            res.on('data', (chunk : any) => {
                data.push(chunk);
            });
            
            res.on('end', () => {
                console.log('Response ended: ');
                let json = JSON.parse(Buffer.concat(data).toString());
                console.log(json);
            });
        }
    );
}

getAllItems();
getItem('zWaveWallPlug4_Switch');

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker.');
    allItems.forEach((item : any) => {
        mqttClient.subscribe(item.name);
    });
});

mqttClient.on('message', (rawTopic : any, rawMsg : any) => {
    let topic : string = rawTopic.toString();
    let msg : string = rawMsg.toString();
    console.log(topic, ' <= ', msg);

    if (msg == "GET") {
        getItem(topic);
    }
});