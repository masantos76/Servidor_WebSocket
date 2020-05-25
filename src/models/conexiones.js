const Sequelize = require('sequelize');
module.exports=function(sequelize,DataTypes){
    return sequelize.define('conexiones',
        {
        id_conexion:{
            type:Sequelize.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },
        
        id_usuario:{
            type:Sequelize.INTEGER,
        },
        fecha_ini:{
            type:'TIMESTAMP',
            default: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        fecha_fin:{
            type:'TIMESTAMP',
            default: Sequelize.literal('CURRENT_TIMESTAMP')
        }
        
    },
    {
        timestamps: false,
        freezeTableName:true
    }
    );
}
