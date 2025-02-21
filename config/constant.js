
var baseurl = "http://localhost:3000/api/v1"                                                                                                   

var constant = {
    app_name: "deals on demand",

    // encryptionKey: encryptLib.getHashSha256("xza548sa3vcr641b5ng5nhy9mlo64r6k", 32),
    // encryptionIV: "5ng5nhy9mlo64r6k",
    // byPassApi: ['forgot Password', 'resendOTP', 'login', 'check_unique', 'signup', 'verify0TP', 'setPassword'],

    profile_image: baseurl + "profile_image/",
    category: baseurl + "category_image/",
    post_image : baseurl  + "post_image/"
};

module.exports = constant;