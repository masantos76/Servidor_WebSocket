const WebSocket = require('ws');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');


/*const sequelize = new Sequelize('bd_chat_mod','jose','josefa',{
    host:'localhost',
    dialect:'mysql',// one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' 
    //pool:{ max:5, min:0, idle:10000}
})*/

const sequelize = new Sequelize('qadh424','qadh424','7150Demeter',{
  host:'qadh424.thematic-learning.com',
  dialect:'mysql',// one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' 
  //pool:{ max:5, min:0, idle:10000}
})

sequelize.authenticate()
  .then(() => {
    console.log('Conectado a la BD')
  })
  .catch(err => {
    console.log('No se ha podido conectar a la BD')
  })

  const tabla_chat=sequelize.import("./models/messages.js");
  const tabla_usuarios=sequelize.import("./models/users.js");
  const tabla_conexiones=sequelize.import("./models/conexiones.js");
  
  // Relacion 1 a N :
  tabla_usuarios.hasMany(tabla_chat, {foreignKey: 'id_usuario'});
  tabla_chat.belongsTo(tabla_usuarios, {as: 'author', foreignKey: 'id_usuario'})

  //Creo las tablas
  sequelize.sync({force:false})


// Comienzo el servidor 
const webSocketServer = new WebSocket.Server({ port: process.env.PORT  });



/*const token = jwt.sign({name:'usuario'},process.env.CLAVE_SECRETA,{
  expiresIn : 15 * 24 * 60 * 60  // 15 days
})
*/


let users={};
let mesas= new Array();
mesas[1]={};
mesas[2]={};
mesas[3]={};
mesas[4]={};

let id=false;//Para que no se duerma al desplegarlo en Heroku


webSocketServer.on('connection',  function(ws)
{
    ws.on('message', toEvent)
      .on('authenticate', function (data)
      {
        
        jwt.verify(data.token, process.env.CLAVE_SECRETA, async function (err, decoded)
        {
        
          if (err)
              ws.send(JSON.stringify({ type: 'system2', message:'No Autorizado'} ))
          else 
          {

            if(data.old_user in users)
            {
              users[data.old_user].send(JSON.stringify({ type: 'cerrar_sesion', message:'No importa'} ))
              users[data.old_user].close();
            }
            var result=await tabla_conexiones.create({
              id_usuario: data.id_usuario,
            })

            if(data.user in users)
            {
              users[data.user].send(JSON.stringify({ type: 'cerrar_formulario', message:'No importa'} ))
              users[data.user].close();
              ws.nickname = data.user;
              ws.id_conex=result.dataValues.id_conexion
              users[ws.nickname]=ws;
            }
            else
            {   
              
                ws.nickname = data.user;
                ws.id_conex=result.dataValues.id_conexion;
                users[ws.nickname]=ws;
                update_nicknames();
            
            }

            ws.send(JSON.stringify({ type: 'conectados_en_mesas', message:{mesa1:Object.keys(mesas[1]).length,mesa2:Object.keys(mesas[2]).length,mesa3:Object.keys(mesas[3]).length,mesa4:Object.keys(mesas[4]).length}} ))
          


            //Y ahora mando los últimos 30 mensajes del usuario logueado 
            const limite=30;
            
            let total=0;
            var BreakException = new Error("Error_controlado para hacer un break");
            var messages=[];
            var contador=0;
            var flag=true;
         
            tabla_conexiones.findAll({ attributes: [ 'fecha_ini','fecha_fin'], order:[['id_conexion', 'DESC']], where:{id_usuario: data.id_usuario} })
              .then(conexiones => { 

               
                  
                    var n_conex=conexiones.length;
                    conexiones.forEach(conexion=>
                    {
                      
                        
                        return tabla_chat.findAll({ attributes: [ 'author.usuario', 'id','mensaje','fecha'], order:[['id', 'DESC']],include: [ { model: tabla_usuarios, as: 'author' } ],where:{opcion1: sequelize.where(sequelize.literal("fecha"),">=",conexion.dataValues.fecha_ini),opcion2:sequelize.where(sequelize.literal("fecha"),"<=",conexion.dataValues.fecha_fin)}, limit: (limite - total)})
                        .then(messages1=>{
                          
                          if(total<limite)
                          {
                          
                            if(messages1.length>0)
                            {
                            
                            
                              messages=messages.concat(messages1);
        
                              total+=messages1.length;
                              
                            }
                        

                            return new Promise(function(resolve,reject){
                              resolve(ws.send(JSON.stringify({ type: 'load_old_msg', message:messages} )))
                            })
                            .then(()=>{
                              contador++;
                              if(contador==n_conex)
                                ws.send(JSON.stringify({ type: 'bajar_scroll', message:'Debido a la asincronía quiero bajar Scroll cuando termine de mandar datos'} ))
                            })
                            
                          }
                          else
                          {
                            if(flag)
                            { 
                              ws.send(JSON.stringify({ type: 'bajar_scroll', message:'Debido a la asincronía quiero bajar Scroll cuando termine de mandar datos'} ))
                              flag=false;
                            }
                            throw BreakException;///para simular el break
                          }  
                        })
                        .catch((e) => {
                          if (e !== BreakException) throw e;
                        })
                     
                        
                      
                    }) 

              })
              
              .catch(error => {   console.log("Error:", error); });
          
           
            
         
            //let messages = await tabla_chat.findAll({ attributes: [ 'author.usuario', 'id','mensaje','fecha'], order:[['id', 'DESC']],include: [ { model: tabla_usuarios, as: 'author' } ], limit:30 })
            
            

            
            
          }
        })
      
      })
      .on('usermsg',function(data)
      {
        if(ws.nickname)
        {
            data1 =JSON.parse(data)
            
            if(data1.message.substring(0,3)==="/p ")
            {
              var data_new=data1.message.substring(3);
              
              const index = data_new.indexOf(' ');
              if(index!=-1){
                  var name = data_new.substring(0,index);
                  
                  data_new =data_new.substring(index +1);
              
                  if(name in users){
                      data1.type="privado";
                      data1.message=data_new;
                      users[name].send(JSON.stringify(data1));
                      data1.message="--- "+data_new+" --- to "+name;
                      ws.send(JSON.stringify(data1));
                      
                  }
                  else
                  {
                    ws.send(JSON.stringify({ type: 'error_privado', message:'Error: Por favor introduzca un Usuario válido !!'} ))
                    
                  }
              }
              else
              {
                  ws.send(JSON.stringify({ type: 'error_privado', message:'Error: Please introduzca un mensaje !!'} ))
                  
              }
            }
            else{
              
                broadcast(data,data1.mesa)
              

            }         
                
        }
      }) 

      .on('connect_mesa', function (data)
      {
        data1 =JSON.parse(data)
        
        ws.send(JSON.stringify({ type: 'init_mesa', message:'data1.mesa'} ))
        mesas[data1.mesa][ws.nickname]="1";
        
        update_nicknames_mesa(data1.mesa);
        var info_mesas=JSON.stringify({ type: 'conectados_en_mesas', message:{mesa1:Object.keys(mesas[1]).length,mesa2:Object.keys(mesas[2]).length,mesa3:Object.keys(mesas[3]).length,mesa4:Object.keys(mesas[4]).length}} )
        broadcast(info_mesas,0)


      })
      .on('close', async function(data)
      {
          if(users[this.nickname]===this)
          {
            delete users[this.nickname];

            await tabla_conexiones.update({fecha_fin: sequelize.literal('CURRENT_TIMESTAMP')}, {where:{id_conexion: this.id_conex}})
  
            var mesa=en_alguna_mesa(this.nickname);
            if(mesa>0)
            {
              delete mesas[mesa][this.nickname];
              update_nicknames_mesa(mesa);
              var info_mesas=JSON.stringify({ type: 'conectados_en_mesas', message:{mesa1:Object.keys(mesas[1]).length,mesa2:Object.keys(mesas[2]).length,mesa3:Object.keys(mesas[3]).length,mesa4:Object.keys(mesas[4]).length}} )
              broadcast(info_mesas,0)
            }  
          }
          update_nicknames();
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
        }, 15000);// 15 segundos
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

function broadcast(data,mesa) {
  webSocketServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      /*if(mesa==0)// Se mandan a todos los que no estén en ninguna mesa
        if(en_alguna_mesa(client.nickname)==0)
          client.send(data);
      else  // Se mandan sólo a los que esten
        if(en_alguna_mesa(client.nickname)>0)
          client.send(data);*/

        if(en_alguna_mesa(client.nickname)==mesa)
          client.send(data);

    }
  });
}

function update_nicknames_mesa(mesa) {
  
  for(client in mesas[mesa]){
  
    if (users[client].readyState === WebSocket.OPEN) {
      users[client].send(JSON.stringify({ type: 'usernames_sala', message:Object.keys(mesas[mesa])}));
    }

    
  };
}

function en_alguna_mesa(usuario)
{
  var en_alguna=0;
  for(var i=1;i<=mesas.length;i++)
  {
    for(client in mesas[i]){
      if(client==usuario)
      {
        en_alguna=i;
        break;
      }
    }
    if(en_alguna>0) break;
  }
  return en_alguna;
}

function update_nicknames() {
  webSocketServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'usernames', message:Object.keys(users)}));
    }

   
  });
}



