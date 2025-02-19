
const common = require('../utilities/common');
const messages = require('../utilities/message');
const code = require('../utilities/request-error-code')

class User {
    test(req,res){
        var m = {
            code : code.SUCCESS,
            message : messages.success,
            data: "Test completed"
        }
      common.response(res,m);  
    }
}

module.exports = new User();