const WebSocket = require('ws');

const webSocketServer = new WebSocket.Server({ port: (process.env.PORT || 8080) });

webSocketServer.on('connection', (webSocket) => {

  //webSocket.send(JSON.stringify({ type: 'system', message:'Conectado'} ))
  
  
  webSocket.on('message', (message) => {
    console.log('Received:', message);
    broadcast(message);
  });


  // Esto es para que Heroku no se me duerma, cada 10 segundos mando un mensaje vano
  setInterval(() => {
    webSocketServer.clients.forEach((client) => {
      client.send(new Date().toTimeString());
    });
  }, 10000);
});

function broadcast(data) {
  webSocketServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}



