const WebSocket = require('ws');

const webSocketServer = new WebSocket.Server({ port: (process.env.PORT || 8080) });

let id=false;

webSocketServer.on('connection', (webSocket) => {

  
  //webSocket.send(JSON.stringify({ type: 'system', message:'Conectado'} ))
  
  
  webSocket.on('message', (message) => {
    console.log('Received:', message);
    broadcast(message);
  });

  

  // Esto es para que Heroku no se  duerma y mantenga las conexiones abiertas aunque no se manden mensajes,
  //cada 15 segundos y mientras tenga al menos un cliente, mando a cada cliente conectado un mensaje "vano"
  
  if(!id)
  {
      let cont=0;
      id=setInterval(() => {
      
      webSocketServer.clients.forEach((client) => {
        cont++
        client.send(new Date().toTimeString());
      });
      
      if(cont==0)
      {
        clearInterval(id);
        id=false;
      }
      cont=0;
    }, 15000);
  }
});



function broadcast(data) {
  webSocketServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}



