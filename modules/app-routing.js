class routing {
    v1(app){
        const routers = require('../routers/route');
        routers(app);
    }
}

module.exports = new routing();
