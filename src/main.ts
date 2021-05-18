const request = require('requests');
const mqtt = require('mqtt');

function getItem(itemName: string) {
    request(
        'http://localhost:8080/rest/item/' + itemName, 
        {json: true},
        (err : any, res : any, body : any) => {
            console.log(res);
        }
    )
}

getItem('zWaveWallPlug4');