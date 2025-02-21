
const UserModel = require('../../v1/models/User-model');
const common = require('../../../utilities/common');
const messages = require('../../../languages/message');
const code = require('../../../utilities/request-error-code')

class User {
    test(req,res){
        var m = {
            code : code.SUCCESS,
            message : messages.success,
            data: "Test completed"
        }
      common.response(res,m);  
    }

    user(req,res){
        UserModel.getUser((err,m)=>{
            common.response(res,m);  
        });   
    }

    login(req,res){
        UserModel.login(req, (err, m) => { // Pass req as the first argument
            if (err) {
                m = {
                    code: code.REQUEST_ERROR,
                    message: messages.operation_failed,
                    data: err
                };
                return common.response(res, m);
            }
            common.response(res, m);
        });
    }

    logout(req,res){
        UserModel.logout(req,(err,m)=>{
            if(err){
                return common.response(res,err);
            }
            else{
                return common.response(res,m)
            }
        })
    }

    signup(req,res){
        UserModel.signup(req, (err, m) => { // Pass req as the first argument
            if (err) {
                m = {
                    code: code.REQUEST_ERROR,
                    message: messages.operation_failed,
                    data: err
                };
                return common.response(res, m);
            }
            common.response(res, m);
        });
    }

    verifyOtp(req,res){
        UserModel.verifyOtp(req,(err,m)=>{
            if(err){
                return common.response(res,m)
            }
            else{
                common.response(res,m);
            }
        })
    }

    resendOtp(req,res){
        UserModel.resendOtp(req,(err,m)=>{
            if(err){
                return common.response(res,err)
            }
            else{
                common.response(res,m);
            }
        })
    }

    updateUser(req,res){
        UserModel.update_data(req,(err,m)=>{
            if(err){
                return common.response(res,err)
            }
            else{
                common.response(res,m);
            }
        })
    }

    changePassword(req,res){
        UserModel.changePass(req,(err,m)=>{
            if(err){
                return common.response(res,err)
            }
            else{
                common.response(res,m);
            }
        })
    }

    forgetPassword(req,res)
    {
        UserModel.forgetPass(req,(err,m)=>{
            if(err){
                return common.response(res,err)
            }
            else{
                common.response(res,m);
            }
        })
    }

    getCategory(req,res){
        UserModel.getCategories(req,(err,m)=>{
            if(err){
                return common.response(res,err)
            }
            else{
                common.response(res,m);
            }
        })
    }

    getDeals(req,res){
        UserModel.getDeals(req,(err,m)=>{
            if(err){
                return common.response(res,err)
            }
            else{
                common.response(res,m);
            }
        })
    }
    
    getPostDetails(req,res){
        UserModel.getPostDetails(req,(err,m)=>{
            if(err){
                return common.response(res,err)
            }
            else{
                common.response(res,m);
            }
        })
    }

    getPostbyCat(req,res){
        UserModel.getPostByCat(req,(err,m)=>{
            if(err){
                return common.response(res,err)
            }
            else{
                common.response(res,m);
            }
        })
    }

    getPostComment(req,res){
        UserModel.getPostComment(req,(err,m)=>{
            if(err){
                return common.response(res,err)
            }
            else{
                common.response(res,m);
            }
        })
    }

    getUserComment(req,res){
        UserModel.getUserComment(req,(err,m)=>{
            if(err){
                return common.response(res,err)
            }
            else{
                common.response(res,m);
            }
        })
    }

    addRate(req,res){
        UserModel.addRate(req,(err,m)=>{
            if(err){
                return common.response(res,err)
            }
            else{
                common.response(res,m);
            }
        })
    }

    getProfile(req,res){
        UserModel.getProfile(req,(err,m)=>{
            if(err){
                return common.response(res,err)
            }
            else{
                common.response(res,m);
            }
        })
    }

    getFollowing(req,res){
        UserModel.getfollowing(req,(err,m)=>{
            if(err){
                return common.response(res,err)
            }
            else{
                common.response(res,m);
            }
        })
    }

    getFollower(req,res){
        UserModel.getFollower(req,(err,m)=>{
            if(err){
                return common.response(res,err)
            }
            else{
                common.response(res,m);
            }
        })
    }

    getSavedPost(req,res){
        UserModel.getSavedPost(req,(err,m)=>{
            if(err){
                return common.response(res,err)
            }
            else{
                common.response(res,m);
            }
        })
    }

}

module.exports = new User();