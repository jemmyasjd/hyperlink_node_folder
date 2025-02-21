class routing {
    v1(app){
        const routers = require('./v1/routers/route');
        routers(app);
    }
}

module.exports = new routing();
