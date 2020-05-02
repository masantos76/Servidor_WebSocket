const WebSocket = require('ws');
require('dotenv').config();



const webSocketServer = new WebSocket.Server({ port: process.env.PORT  });
const jwt = require('jsonwebtoken');


/*const token = jwt.sign({name:'usuario'},process.env.CLAVE_SECRETA,{
  expiresIn : 15 * 24 * 60 * 60  // 15 days
})
*/



let id=false;


webSocketServer.on('connection', function(ws) {
    ws.on('message', toEvent)
    .on('authenticate', function (data) {
      jwt.verify(data.token, process.env.CLAVE_SECRETA, function (err, decoded) {
      
          if (err) {
            ws.send(JSON.stringify({ type: 'system2', message:'No Autorizado'} ))
        } else {
          ws.userId= decoded.name 
            
        }
      })
    
    })
    .on('usermsg',function(data){
      if(ws.userId){
          //user previously authenticated - update 
          broadcast(data)
          }
      })  
    
    
  
  

  // Esto es para que Heroku no se  duerma y mantenga las conexiones abiertas aunque no se manden mensajes,
  // Cada 15 segundos y mientras tenga al menos un cliente, mando a cada cliente conectado un mensaje "vano"
  
  if(!id)
  {
      let cont=0;
      id=setInterval(() => {
      
      webSocketServer.clients.forEach((client) => {
        cont++
        
        client.send(JSON.stringify({ type: 'no_sleep', message: new Date().toTimeString()}));
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

function toEvent (message) {
  try {
    let {type, payload} = JSON.parse(message)
    
    this.emit(type, payload || message)
  } catch (ignore) {
    this.emit(undefined, message)
  }
}

function broadcast(data) {
  webSocketServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}



