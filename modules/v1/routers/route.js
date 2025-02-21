const User = require('../controllers/test');

var customRoute= (app) => {
    app.get('/v1/user/test', User.test);
    app.get('/v1/user/list',User.user);
    app.post('/v1/user/login',User.login);
    app.post('/v1/user/signup',User.signup);
    app.post('/v1/user/logout/:id',User.logout);
    app.post('/v1/user/verify/:id',User.verifyOtp);
    app.post('/v1/user/resend/:id',User.resendOtp);
    app.post('/v1/user/update/:id',User.updateUser);
    app.post('/v1/user/forget',User.forgetPassword);
    app.post('/v1/user/profile/',User.getProfile);
    app.post('/v1/user/change/:id',User.changePassword);


    app.get('/v1/user/category',User.getCategory);
    app.get('/v1/user/deals',User.getDeals);
    app.get('/v1/user/post/:id',User.getPostDetails);
    app.get('/v1/user/category/:id',User.getPostbyCat);
    app.get('/v1/user/comments/:id',User.getPostComment);
    app.get('/v1/user/usercomment/:id',User.getUserComment);
    app.get('/v1/user/addrate/:id',User.addRate);
    app.post('/v1/user/following/',User.getFollowing);
    app.post('/v1/user/follower/',User.getFollower);
    app.post('/v1/user/saved/',User.getSavedPost);


}

module.exports = customRoute;