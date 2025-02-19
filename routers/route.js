const User = require('../controllers/test');

var customRoute= (app) => {
    app.get('/test', User.test);
}

module.exports = customRoute;