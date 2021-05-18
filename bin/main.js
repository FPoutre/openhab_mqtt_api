"use strict";
var request = require('requests');
function getItem(itemName) {
    request('http://localhost:8080/rest/item/' + itemName, { json: true }, function (err, res, body) {
        console.log(res);
    });
}
getItem('zWaveWallPlug4');
