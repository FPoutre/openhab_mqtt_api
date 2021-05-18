export const http = require('http');

export function getItem(itemName: string) {
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