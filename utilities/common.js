const httpStatus = require('http-status-codes')

class Utility {
    generateOtp(){
        // generate otp of 4 digit 
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    response(res,message,status_code = httpStatus.OK ){
        res.status(status_code);
        res.send(message);
    }
}

module.exports = new Utility();
