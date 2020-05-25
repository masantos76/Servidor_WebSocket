const Sequelize = require('sequelize');
module.exports=function(sequelize,DataTypes){
    return sequelize.define('usuarios',
        {
        id_usuario:{
            type:Sequelize.INTEGER,
            autoIncrement:true,
            primaryKey:true
        },
        
        usuario:{
            type:Sequelize.STRING,
        },
        clave:{
            type:Sequelize.STRING,
        }
        
    },
    {
        timestamps: false,
        freezeTableName:true
    }
    );
}
