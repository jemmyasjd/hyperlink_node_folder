const httpStatus = require('http-status-codes')
const connection = require('../config/database');
const { user } = require('../modules/v1/controllers/test');
const code = require('./request-error-code')
const message =require('../languages/message')
const constant = require('../config/constant')

class Utility {
    generateOtp(){
        // generate otp of 4 digit 
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    response(res,message,status_code = httpStatus.OK ){
        res.status(status_code);
        res.send(message);
    }

    generateToken(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < length; i++) {
            token += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return token;
    }

    getUserInfo(userid,callback){
        const select_query = 'select *,concat(?,profile_image),id as user_id from tbl_user where id = ?'
        const conditions = [constant.profile_image,userid];

        connection.query(select_query,conditions,(err,rows)=>{
            if(err){
                callback(err.sqlMessage,null);
            }
            else{
                callback(null,{code: code.SUCCESS, message : message.success, data: rows})
            }
        })
    }

    editProfile(userid,data,callback){
        const select_query='update tbl_user set ? where id = ?'
        connection.query(select_query,[data,userid],(err,row)=>{
            if(err){
                callback(err.sqlMessage,null)
            }else if(row.affectedRows===0){
                callback("No user found to update the details",{code : code.REQUEST_ERROR,message: message.unsuccess})
            }
            else{
                this.getUserInfo(userid,callback);
            }
        })
    }

    updateDeviceInfo(userid,data, callback){
        // console.log(userid,data)
        connection.query('update tbl_device set ? where user_id = ?',[data,userid],(err,rows)=>{
            // console.log(rows)
            if(err){
                callback(err.sqlMessage,null)
            }else if(rows.affectedRows===0){
                callback("No user found to update the details",{code : code.REQUEST_ERROR,message: message.unsuccess})
            }
            else{
                this.getUserInfo(userid,callback);
            }
        })
    }

}

module.exports = new Utility();

u = new Utility();

