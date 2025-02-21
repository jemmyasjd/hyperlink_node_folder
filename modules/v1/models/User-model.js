const connection = require('../../../config/database');
const messages = require('../../../languages/message');
const code = require('../../../utilities/request-error-code')
const common = require('../../../utilities/common')
const constant = require('../../../config/constant')
const md5 = require('md5')

class userModel{
   
    //getting the user 
    getUser(callback){
        connection.query('SELECT id,firstname,lastname FROM tbl_user where is_active=1 and is_deleted=0', (err, rows) => {
           if(err){
            return callback(err.sqlMessage,null);  
           }
           var m = {
            code : code.SUCCESS,
            message : messages.success,
            data : rows
        }
           callback(null,m);
        });
    }

    //login the user 

    login(req,callback){

        let select_query = ""
        let conditions = []
        const data = {
        }
        // console.log(data);
        if(req.body.username != undefined){
            data.username = req.body.username;
        }

        if(req.body.password != undefined){
            data.password = req.body.password;
        }
        if (!data.username || !data.password) {
            return callback("Please insert the username and password", null);
        }
        data.password = md5(data.password);
        // console.log(data.username, data.password);
        
        if (req.body.login_type == 'S') {
            select_query = 'SELECT *, id AS user_id, CONCAT(?, profile_image) FROM tbl_user WHERE username=? AND password=?';
            conditions = [constant.profile_image, data.username, data.password];
        } else {
            select_query = 'SELECT *, id AS user_id, CONCAT(?, profile_image) FROM tbl_user WHERE email = ? AND social_id = ? AND login_type = ? AND is_deleted = 0';
            conditions = [constant.profile_image, data.email, req.body.social_id, req.body.login_type];
        }
        

        
        connection.query(select_query, conditions,(err,row)=>{
            // console.log(row)
            if(err) {
                 callback(err.sqlMessage,null)
            }
            else if (row.length ==0 ){
                callback(null,{code : code.CODE_NULL, messages : messages.no_data_found})
            }
            else {
                let details = row[0]
                if(details.is_verified == 1 ){
                    if(details.is_active==0 && details.is_deleted==0){
                        return callback("account has been deactivated",{code: code.INACTIVE_ACCOUNT,messages: messages.account_is_deactivated})
                    }
                    else if(details.is_active=0 && details.is_deleted==1) {
                        return callback("account deleted",{code: code.INACTIVE_ACCOUNT, messages : "account is deleted"})
                     }
                    else {
                    let data = {
                        device_token: req.body.device_token,
                        device_type: req.body.device_type,
                        os_version: req.body.os_version,
                        app_version: req.body.app_version,
                        token: common.generateToken(40)
                    }

                    if (Object.values(data).some(value => value === undefined)) { 
                        return callback("Please insert all required data", { code: code.REQUEST_ERROR, messages: messages.missing_param });
                    }
                     else {
                        console.log(details.id);
                        common.updateDeviceInfo(details.id, data, callback);
                    }
                }

                }
                else{
                    callback("Please verify first", {code : code.OTP_NOT_VERIFIED, messages: messages.not_verified_2})
                }
            }
        })
    }

    //signing up user 

    signup(req,callback){
        let data = {}
        let select_query = "insert into tbl_user set ? "
        let conditions = []

        if(req.body.login_type !== 'S'){
            data.email = req.body.email,
            data.social_id = req.body.social_id,
            data.login_type = req.body.login_type,
            data.mobile= req.body.mobile
        }
        else{
            data =  {
                username : req.body.username,
                mobile : req.body.mobile,
                country_code : req.body.country_code,
                email : req.body.email
            }
            if(req.body.password!== undefined && req.body.password !==''){
                data.password = md5(req.body.password);
            }
        }
        

        if (Object.values(data).some(value => value === undefined)) { 
            return callback("Please insert all required data", { code: code.REQUEST_ERROR, messages: messages.missing_param });
        }

        connection.query(select_query,data,(err,row)=>{
            if(err){
                callback(err.sqlMessage,null);
            }
            else if(row.affectedRows==0){
               callback("USer not inserted",{code : code.NOT_REGISTERED , messages : messages.not_approved})
            }
            else {
                let device_data = {
                    device_token: req.body.device_token,
                    device_type: req.body.device_type,
                    os_version: req.body.os_version,
                    app_version: req.body.app_version,
                    token: common.generateToken(40),
                    user_id : row.insertId
                }

                if (Object.values(device_data).some(value => value === undefined)) { 
                    return callback("Please insert all required data", { code: code.REQUEST_ERROR, messages: messages.missing_param });
                }
                else {
                    connection.query('insert into tbl_device set ?',[device_data],(err,row)=>{
                        if(err){
                            callback(err.sqlMessage,null);
                        }
                        else if(row.affectedRows==0){
                           callback("USer not inserted",{code : code.NOT_REGISTERED , messages : messages.not_approved})
                        }
                        else{
                           const opt = common.generateOtp();
                            connection.query('insert into tbl_verify (otp,number,user_id) values (?, ? , ?)',[opt,data.mobile,device_data.user_id],(err,row)=>{
                                if(err){
                                    callback(err.sqlMessage,null);
                                }
                                else if(row.affectedRows==0){
                                   callback("USer info not inserted",{code : code.NOT_REGISTERED , messages : messages.not_approved})
                                }
                                else{
                                    const data = {
                                        otp_code : opt,
                                        id : device_data.user_id,
                                        token : device_data.token
                                    }
                                    callback(null,{ data: data});
                                }
                            })
                        }
                        
                    })
                }
            }
        })
    }

    verifyOtp(req,callback){
        const id = req.params.id
        const opt_to_check = req.body.otp;

        connection.query('select * from tbl_verify where user_id = ? and otp= ?',[id,opt_to_check],(err,row)=>{
            if(err){
                callback(err.sqlMessage,null);
            }
            else if(row.length==0){
               callback("Otp does not match",{code : code.OTP_NOT_VERIFIED, messages : messages.operation_failed})
            }else{
                connection.query('update tbl_user set is_verified = 1 where id = ? and is_active =1 and is_deleted=0',[id],(err,row)=>{
                    if(err){
                        callback(err.sqlMessage,null);
                    }
                    else if(row.affectedRows==0){
                       callback("User info not updated",null)
                    }
                    else{
                        callback("logged in sucessfull",{code : code.SUCCESS, messages: "verified successfully"})
                    }
                })
            }
        })
    }

    resendOtp(req, callback) {
        const id = req.params.id;
        if (!id || id.trim() === "") {
            return callback("Invalid user ID", { 
                code: code.REQUEST_ERROR, 
                messages: "User ID is required" 
            });
        }
    
        const otp = common.generateOtp();
        console.log("Generated OTP:", otp);
    
        connection.query(
            'UPDATE tbl_verify SET otp = ? WHERE user_id = ?',
            [otp, id],
            (err, row) => {
                if (err) {
                    console.error("MySQL Error:", err.sqlMessage);
                    return callback(err.sqlMessage, null);
                }
                if (row.affectedRows === 0) {
                    console.warn("No rows updated for user_id:", id);
                    return callback("User info not updated", { 
                        code: code.OTP_NOT_VERIFIED, 
                        messages: messages.operation_failed 
                    });
                }
    
                console.log("OTP successfully updated for user_id:", id);
                return callback(null, { data: otp });
            }
        );
    }
    

    update_data(req, callback) {

        const allowedFields = [
            "username", "firstname", "lastname", "email", "password", "profile_image",
            "bg_img", "is_member", "bio", "country_code", "mobile", "referral_code",
            "dob", "gender", "user_type", "login_type", "social_id", "is_verified"
        ];


        const userid = req.params.id;
        let data = {};
    
        Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key) && req.body[key] !== undefined && req.body[key] !== null && req.body[key] !== '') {
            data[key] = key === "password" ? md5(req.body[key]) : req.body[key]; 
        }
        });
        
        if (Object.keys(data).length === 0) {
            return callback({ error: "No valid fields to update" });
        }
    
        common.editProfile(userid, data, callback);
    }

    logout(req,callback){
        const id = req.params.id;
        let query = 'update tbl_user set is_active=0 where id = ?'
        connection.query(query,id,(err,row)=>{
            if(err){
                callback(err.sqlMessage,null);
            }
            if (row.affectedRows === 0) {
                return callback("User not found or no changes made", null);
            }
            else {
                let data = {
                    device_token: null,
                    device_type: null,
                    device_name : null,
                    device_model : null,
                    os_version: null,
                    app_version: null,
                    time_zone : null,
                    token: null,
                    is_active : 0
                }
                common.updateDeviceInfo(id, data, callback);
            }
        })
    }

    forgetPass(req, callback) {
        let is_email = req.body.email;
        let field = "email";
    
        if (!is_email) {
            field = "username";
            is_email = req.body.username;
        }
    
        console.log(field, is_email);
    
        let password = req.body.password;
    
        if (!password) {
            return callback("Please enter the password to change", null);
        }
    
        // Correct query syntax
        let query = `SELECT * FROM tbl_user WHERE ${field} = ? AND is_active = 1 AND is_deleted = 0`;
        connection.query(query, [is_email], (err, row) => {
            // console.log(row);
            if (err) {
                return callback(err.sqlMessage, null);
            }
            if (!row || row.length === 0) {
                return callback("User not found", null);
            }
    
            // Validate old password
            if (md5(password) === row[0].password) {
                return callback("Updated password cannot be the same as old password", null);
            }
    
            // Correct update query
            let updateQuery = `UPDATE tbl_user SET password = ? WHERE ${field} = ? AND is_active = 1 AND is_deleted = 0`;
            connection.query(updateQuery, [md5(password), is_email], (err, result) => {
                if (err) {
                    return callback(err.sqlMessage, null);
                }
                if (result.affectedRows === 0) {
                    return callback("User not found or no changes made", null);
                }
    
                common.getUserInfo(row[0].id, callback);
            });
        });
    }
    
    changePass(req,callback){
        let userid = req.params.id;
        console.log(userid);
        let password = req.body.password;
        let oldpass = req.body.oldpass;

        if(password == null || password ==undefined || password == '' ){
           return callback("please enter the password to change",null);
        }
        else if (oldpass == null || oldpass ==undefined || oldpass == ''){
            return callback("please enter the old password",null)
        }
        else{
            connection.query('select * from tbl_user where id= ? and is_active=1 and is_deleted =0',[userid],(err,row)=>{
                // console.log(row)
                if(err){
                    callback(err.sqlMessage,null);
                }
                if (row.length === 0) {
                    return callback("User not found", null);
                }
                else{
                    if(md5(oldpass) !== row[0].password){
                        return callback("Please enter the correct old password",null);
                    }
                    else{
                        if(md5(oldpass) == md5(password)){
                            return callback("Old and new password cannot be same",null)
                        }
                       connection.query('update tbl_user set password = ? where id=? and is_active=1 and is_deleted=0',[password,userid],(err,row)=>{
                            if(err){
                                callback(err.sqlMessage,null);
                            }
                            if (row.affectedRows === 0) {
                                return callback("User not found or no changes made", null);
                            }
                            else{
                                common.getUserInfo(userid,callback)
                            }
                       })
                    }
                }
            })
        }
    }

    // Home Screen

    getCategories(req,callback){
        connection.query(`SELECT 
    c.*,
    concat(?,c.img) as img, 
    (SELECT IFNULL(COUNT(*), 0) 
     FROM tbl_b_post p 
     WHERE p.is_active = 1 
    AND p.is_deleted = 0 
    AND p.cat_id = c.id) AS post_count
    FROM tbl_category c 
    WHERE c.is_active = 1 
    AND c.is_deleted = 0;`,[constant.category],(err,rows)=>{
            if(err){
               return callback(err.sqlMessage,null);
            }
            if (rows.length === 0) {
                return callback(null, {code: code.CODE_NULL , messages : messages.no_data_found, data : []});
            }
            else{
               return callback(null,rows)
            }
        })
    }

    getDeals(req,callback){
        const latitude = req.body.latitude
        const longitude = req.body.longitude
        const userid = req.body.id

        if(!latitude || !longitude || !userid || userid == '') 
        {
           return callback({code : code.REQUEST_ERROR, messages : messages.missing_param},null);
        }
        const select_query = `SELECT 
                p.*, 
                u.profile_image, 
                u.firstname, 
                u.lastname, 
            DATE_FORMAT(p.created_at, '%d %b %Y %l:%i %p') AS time_date,
            CASE 
                    WHEN EXISTS (SELECT 1 FROM tbl_wishlist w WHERE w.bus_post_id = p.id AND w.user_id = ?) 
                    THEN 'yes' 
                    ELSE 'no' 
                END AS is_wishlisted,
            case when EXISTS (SELECT 1 from tbl_rating r where r.buss_post_id=p.id and r.user_id=?) then "yes" else "no" end as rated,
            6371 * ACOS(
                    COS(RADIANS(?)) 
                    * COS(RADIANS(p.latitude)) 
                    * COS(RADIANS(p.longitude) - RADIANS(?)) 
                    + SIN(RADIANS(?)) 
                    * SIN(RADIANS(p.latitude))
                ) AS distance
            FROM tbl_b_post p 
            JOIN tbl_user u ON u.id = p.user_id 
            WHERE p.is_active = 1 AND p.is_deleted = 0 and u.is_active=1 and u.is_deleted=0 HAVING distance < 100;`
        const condition = [userid,userid,latitude,longitude,latitude]
        connection.query(select_query,condition,(err,rows)=>{
            if(err){
               return callback(err.sqlMessage,null);
            }
            if (rows.length === 0) {
                return callback(null, {code: code.CODE_NULL , messages : messages.no_data_found, data : []});
            }
            else{
                return callback(null,{code: code.SUCCESS, messages : messages.success , data: rows})
            }
        })
    }

    getPostDetails(req,callback){
        const postid = req.params.id
        const userid = req.body.userid

        const sq = `SELECT 
                p.*, 
                u.profile_image, 
                u.firstname, 
                u.lastname, 
                DATE_FORMAT(p.created_at, '%d %b %Y %l:%i %p') AS time_date,
                (SELECT c.name from tbl_category c where c.is_active=1 and c.is_deleted=0 and c.id=p.cat_id) as cat_name,
                CASE 
                    WHEN EXISTS (SELECT 1 FROM tbl_wishlist w WHERE w.bus_post_id = p.id AND w.user_id = ?) 
                    THEN 'yes' ELSE 'no' 
                END AS is_wishlisted,
                GROUP_CONCAT(pt.name) AS tags,
                case when EXISTS (SELECT 1 from tbl_rating r where r.buss_post_id=p.id and r.user_id=?) then "yes" else "no" end as rated
                FROM tbl_b_post p 
                JOIN tbl_user u ON u.id = p.user_id 
                JOIN tbl_category c ON c.id = p.cat_id
                LEFT JOIN tbl_post_tag pt ON pt.buss_post_id = p.id  -- Mapping table
                WHERE p.is_active = 1 
                AND p.is_deleted = 0 
                AND p.id = ?
                GROUP BY p.id;`
            const cd= [userid,userid,postid]

            if(postid==="" || !postid || !userid || userid == '') 
            {
                return callback({code : code.REQUEST_ERROR, messages : messages.missing_param},null);
            }

            connection.query(sq,cd,(err,rows)=>{
                if(err){
                    return callback(err.sqlMessage,null);
                 }
                 if (rows.length === 0) {
                     return callback(null, {code: code.CODE_NULL , messages : messages.no_data_found, data : []});
                 }
                 else{
                    return callback(null,{code: code.SUCCESS, messages : messages.success , data: rows})
                }
            })
    }

    getPostByCat(req,callback){
        const userid = req.body.userid
        const cat_id = req.params.id

        if(userid==="" || !userid || !cat_id || cat_id === '') 
        {
            return callback({code : code.REQUEST_ERROR, messages : messages.missing_param},null);
        }

        const sq = `SELECT 
                p.*, 
                concat(?,u.profile_image) as image, 
                u.firstname, 
                u.lastname, 
            DATE_FORMAT(p.created_at, '%d %b %Y %l:%i %p') AS time_date,
            CASE 
                    WHEN EXISTS (SELECT 1 FROM tbl_wishlist w WHERE w.bus_post_id = p.id AND w.user_id = ?) 
                    THEN 'yes' 
                    ELSE 'no' 
                END AS is_wishlisted,
            case when EXISTS (SELECT 1 from tbl_rating r where r.buss_post_id=p.id and r.user_id=2) then "yes" else "no" end as rated
            FROM tbl_b_post p 
            JOIN tbl_user u ON u.id = p.user_id 
            WHERE p.is_active = 1 AND p.is_deleted = 0 and u.is_active=1 and u.is_deleted=0 and p.cat_id=?;`
        const cd = [constant.category,userid,cat_id]

        connection.query(sq,cd,(err,rows)=>{
            if(err){
                return callback(err.sqlMessage,null);
             }
             if (rows.length === 0) {
                 return callback(null, {code: code.CODE_NULL , messages : messages.no_data_found, data : []});
             }
             else{
                return callback(null,{code: code.SUCCESS, messages : messages.success , data: rows})
            }
        })
    }

    getPostComment(req,callback){
        const postid = req.params.id
        if(postid==="" || !postid) 
        {
            return callback({code : code.REQUEST_ERROR, messages : messages.missing_param},null);
        }

        const sq =`SELECT u.firstname,u.lastname,p.img,p.title,DATE_FORMAT(p.created_at, '%d %b %Y %l:%i %p') AS time_date from tbl_b_post p join tbl_user u on u.id=p.user_id where p.is_active=1 and p.is_deleted=0 and p.id=? and u.is_active=1 and u.is_deleted=0;`
        const cd = [postid]

        connection.query(sq,cd,(err,rows)=>{
            if(err){
                return callback(err.sqlMessage,null);
             }
             if (rows.length === 0) {
                 return callback(null, {code: code.CODE_NULL , messages : messages.no_data_found, data : []});
             }
             else{
                let details = rows[0];
                console.log(details);

                const query = `SELECT 
                        cm.comment,
                        u.firstname,u.lastname,u.profile_image,
                        DATE_FORMAT(cm.created_at, '%d %b %Y %l:%i %p') AS time_date
                        FROM tbl_user u JOIN tbl_comment cm on cm.user_id=u.id
                        WHERE cm.post_id=? and cm.is_active=1 and cm.is_deleted=0 and u.is_active=1 and u.is_deleted=0;`
                const condition = [postid]

                connection.query(query,condition,(err,rows)=>{
                    if(err){
                        return callback(err.sqlMessage,null);
                     }
                     else {
                        details.comments = rows.length>0 ? rows : []
                        return callback(null,{code: code.SUCCESS, messages : messages.success , data: details})
                     }
                })
             }
        })

    }

    getUserComment(req,callback){
        const postid = req.params.id
        if(postid==="" || !postid) 
        {
            return callback({code : code.REQUEST_ERROR, messages : messages.missing_param},null);
        }

        const sq =`SELECT us.firstname,us.lastname, DATE_FORMAT(us.created_at, '%d %b %Y %l:%i %p') as time,u.title AS time_date from tbl_user_post u join tbl_user us on us.id=u.user_id where u.is_active=1 and u.is_deleted=0 and u.id=?;`
        const cd = [postid]

        connection.query(sq,cd,(err,rows)=>{
            if(err){
                return callback(err.sqlMessage,null);
             }
             if (rows.length === 0) {
                 return callback(null, {code: code.CODE_NULL , messages : messages.no_data_found, data : []});
             }
             else{
                let details = rows[0];
                // console.log(details);

                const query = `SELECT cm.comment,cm.address,cm.latitude,cm.longitude,u.firstname,u.lastname,u.profile_image,    DATE_FORMAT(cm.created_at, '%d %b %Y %l:%i %p') AS time_date from tbl_comment cm join tbl_user u on u.id=cm.user_id
                where cm.is_active=1 and cm.is_deleted=0 and cm.post_id=? and cm.type='U';`
                const condition = [postid]

                connection.query(query,condition,(err,rows)=>{
                    if(err){
                        return callback(err.sqlMessage,null);
                     }
                     else {
                        details.comments = rows.length>0 ? rows : []
                        return callback(null,{code: code.SUCCESS, messages : messages.success , data: details})
                     }
                })
             }
        })

    }


    addRate(req,callback){
        const data = {  
            buss_post_id : req.params.id,
            user_id : req.body.user_id,
            rating : req.body.rating
        }

        if (Object.values(data).some(value => value === undefined)) { 
            return callback({ code: code.REQUEST_ERROR, messages: messages.missing_param }, null);
        }

        connection.query('select * from tbl_rating where is_active=1 and is_deleted=0 and user_id = ?',[data.user_id],(err,rows)=>{
            if(err){
                return callback(err.sqlMessage,null);
             }
             if (rows.length === 0) {
                connection.query('insert into tbl_rating set ?',data,(err,row)=>{
                    if(err){
                        return callback(err.sqlMessage,null);
                    }
                    if (row.affectedRows === 0) {
                        return callback({code: code.REQUEST_ERROR, messages : "There is some error"},null);
                    }else{
                        return callback(null,{code : code.success , messages : "Review inserted successfully"})
                    }
                })
             }
             else{
                return callback(null,{code : code.success , messages : "Review already done", data : rows[0]})
             }
        })
    }

    getProfile(req,callback){
        let data ={
           userid : req.body.userid,
           profileid : req.body.profileid,
           user_type : req.body.user_type
        }
        if (Object.values(data).some(value => value === undefined)) { 
            return callback({ code: code.REQUEST_ERROR, messages: messages.missing_param }, null);
        }

        let query =``;
        let condition = []
        if(data.user_type == 'B'){
            if(data.userid !== data.profileid){
                query = ` SELECT concat(?,u.profile_image) as image,u.firstname,u.lastname,u.bg_img,u.bio,b.name as businness,b.address,c.name as  category,(select count(f.id) from tbl_follow f where f.user_id=? and f.status='accept' GROUP by f.user_id) as following,(select count(f.id) from tbl_follow f where f.follow_id=?  and f.status='accept' GROUP by f.follow_id) as followers,case when (SELECT 1 from tbl_follow f where f.user_id=? and f.follow_id=?) then "yes" else "no" end as is_following from tbl_user u join tbl_business b on b.user_id= u.id join tbl_category c on c.id=b.cat_id where u.is_active=1 and u.is_deleted=0 and u.id=? and b.is_active=1 and b.is_deleted=0 and c.is_active=1 and c.is_deleted=0;`
                condition = [constant.profile_image,data.profileid,data.profileid,data.userid,data.profileid,data.profileid]
            }
            else{
                query =  `SELECT concat(?,u.profile_image) as image,u.firstname,u.lastname,u.bg_img,u.bio,b.name as businness,b.address,c.name as  category,(select count(f.id) from tbl_follow f where f.user_id=? and f.status='accept' GROUP by f.user_id) as following,(select count(f.id) from tbl_follow f where f.follow_id=?  and f.status='accept' GROUP by f.follow_id) as followers from tbl_user u join tbl_business b on b.user_id= u.id join tbl_category c on c.id=b.cat_id where u.is_active=1 and u.is_deleted=0 and u.id=? and b.is_active=1 and b.is_deleted=0 and c.is_active=1 and c.is_deleted=0;`
                condition = [constant.profile_image,data.profileid,data.profileid,data.profileid]
            }
        }
        else{
            if(data.userid !== data.profileid){
                query=`SELECT concat(?,u.profile_image) as image,u.firstname,u.lastname,u.bg_img,u.bio,(select count(f.id) from tbl_follow f where f.user_id=? and f.status='accept' GROUP by f.user_id) as following,(select count(f.id) from tbl_follow f where f.follow_id=?  and f.status='accept' GROUP by f.follow_id) as followers,case when (SELECT 1 from tbl_follow f where f.user_id=? and f.follow_id=?) then "yes" else "no" end as is_following from tbl_user u where u.is_active=1 and u.is_deleted=0 and u.id=?;`

                condition = [constant.profile_image,data.profileid,data.profileid,data.userid,data.profileid,data.profileid]
            }

            else{
                query =  `SELECT concat(?,u.profile_image) as image,u.firstname,u.lastname,u.bg_img,u.bio,(select count(f.id) from tbl_follow f where f.user_id=? and f.status='accept' GROUP by f.user_id) as following,(select count(f.id) from tbl_follow f where f.follow_id=?  and f.status='accept' GROUP by f.follow_id) as followers from tbl_user u where u.is_active=1 and u.is_deleted=0 and u.id=?;`
                condition = [constant.profile_image,data.profileid,data.profileid,data.profileid]
            }


        }

        connection.query(query,condition,(err,rows)=>{
            if(err){
                return callback(err.sqlMessage,null);
            }
            if (rows.length === 0) {
                return callback(null,{code : code.SUCCESS, messages : messages.no_data_found , data: []});
            }
            else{
                const details = rows;
                // console.log(details[0].is_following);
                if((details[0].is_following !==undefined && details[0].is_following == 'yes') || data.profileid === data.userid){
                    if(data.user_type == 'B'){
                        connection.query('SELECT b.img from tbl_b_post b where b.is_active=1 and b.is_deleted=0 and b.user_id=?;',[data.profileid],(err,result)=>{
                            if(err){
                                return callback(err.sqlMessage,null);
                            }
                            else{
                                details[0].images = result.length > 0 ? result : [];
                                console.log(details);
                                return callback(null,{code: code.SUCCESS, messages : messages.success , data: details})
                            }
                        })
                    }else{
                        connection.query(`SELECT u.*,DATE_FORMAT(u.created_at, '%d %b %Y %l:%i %p') AS time_date,c.name as category_name from tbl_user_post u join tbl_user us on us.id=u.user_id join tbl_category c on c.id=u.cat_id
                        where u.is_active=1 and u.is_deleted=0 and u.user_id=?; `,[data.profileid],(err,result)=>{
                            if(err){
                                return callback(err.sqlMessage,null);
                            }
                            else{
                                details[0].posts = result.length > 0 ? result : [];
                                // console.log(details);
                                // console.log(result);
                                return callback(null,{code: code.SUCCESS, messages : messages.success , data: details})
                            }
                        })
                    }
                }
                else{
                    return callback(null,{code : code.SUCCESS, messages : messages.no_data_found , data: []});     
                }
            }
        })

    }

    getfollowing(req,callback){
        const userid = req.body.userid

        if(!userid || userid === undefined || userid == ""){
            return callback({code : code.REQUEST_ERROR, messages : messages.missing_param},null);
        }

        connection.query(`SELECT f.follow_id as follow_id, f.is_active as is_following, u.firstname,u.lastname,u.profile_image from tbl_follow f join tbl_user u on u.id=f.follow_id where f.is_active=1 and f.is_deleted=0 and f.user_id=?;`,[userid],(err,rows)=>{
            if(err){
                return callback(err.sqlMessage,null);
            }
            if (rows.length === 0) {
                return callback(null,{code : code.SUCCESS, messages : messages.no_data_found , data: []});
            }
            else{
                return callback(null,{code: code.SUCCESS, messages : messages.success , data: rows})
            }
        })
    }

    getFollower(req,callback){
        const userid = req.body.userid

        if(!userid || userid === undefined || userid == ""){
            return callback({code : code.REQUEST_ERROR, messages : messages.missing_param},null);
        }

        connection.query(`SELECT f.user_id as follower_id,f.is_active as is_follower, u.firstname,u.lastname,u.profile_image from tbl_follow f join tbl_user u on u.id=f.user_id where f.is_active=1 and f.is_deleted=0 and f.follow_id=?;`,[userid],(err,rows)=>{
            if(err){
                return callback(err.sqlMessage,null);
            }
            if (rows.length === 0) {
                return callback(null,{code : code.SUCCESS, messages : messages.no_data_found , data: []});
            }
            else{
                return callback(null,{code: code.SUCCESS, messages : messages.success , data: rows})
            }
        })
    }

    getSavedPost(req,callback){
        const userid = req.body.userid

        if(!userid || userid === undefined || userid == ""){
            return callback({code : code.REQUEST_ERROR, messages : messages.missing_param},null);
        }

        connection.query(`SELECT p.*,u.profile_image, 
                u.firstname, 
                u.lastname, 
                w.is_active =1 as is_saved,
                case when EXISTS (SELECT 1 from tbl_rating r where r.buss_post_id=p.id and r.user_id=?) then "yes" else "no" end as rated,
                DATE_FORMAT(p.created_at, '%d %b %Y %l:%i %p') AS time_date from tbl_wishlist w join tbl_b_post p on p.id=w.bus_post_id join tbl_user u on u.id=p.user_id
                where w.is_active=1 and w.is_deleted=0 and w.user_id=?;`,[userid,userid],(err,rows)=>{
            if(err){
                return callback(err.sqlMessage,null);
            }
            if (rows.length === 0) {
                return callback(null,{code : code.SUCCESS, messages : messages.no_data_found , data: []});
            }
            else{
                return callback(null,{code: code.SUCCESS, messages : messages.success , data: rows})
            }
        })
    }

    getFilteredPost(req,callback){
        const latitude = req.body.latitude
        const longitude = req.body.longitude
        const userid = req.body.id

        if(!latitude || !longitude || !userid || userid == '') 
        {
           return callback({code : code.REQUEST_ERROR, messages : messages.missing_param},null);
        }
        const select_query = `SELECT 
                p.*, 
                u.profile_image, 
                u.firstname, 
                u.lastname, 
            DATE_FORMAT(p.created_at, '%d %b %Y %l:%i %p') AS time_date,
            CASE 
                    WHEN EXISTS (SELECT 1 FROM tbl_wishlist w WHERE w.bus_post_id = p.id AND w.user_id = ?) 
                    THEN 'yes' 
                    ELSE 'no' 
                END AS is_wishlisted,
            case when EXISTS (SELECT 1 from tbl_rating r where r.buss_post_id=p.id and r.user_id=?) then "yes" else "no" end as rated,
            6371 * ACOS(
                    COS(RADIANS(?)) 
                    * COS(RADIANS(p.latitude)) 
                    * COS(RADIANS(p.longitude) - RADIANS(?)) 
                    + SIN(RADIANS(?)) 
                    * SIN(RADIANS(p.latitude))
                ) AS distance
            FROM tbl_b_post p 
            JOIN tbl_user u ON u.id = p.user_id 
            WHERE p.is_active = 1 AND p.is_deleted = 0 and u.is_active=1 and u.is_deleted=0 HAVING distance < 100;`
        const condition = [userid,userid,latitude,longitude,latitude]
        connection.query(select_query,condition,(err,rows)=>{
            if(err){
               return callback(err.sqlMessage,null);
            }
            if (rows.length === 0) {
                return callback(null, {code: code.CODE_NULL , messages : messages.no_data_found, data : []});
            }
            else{
                return callback(null,{code: code.SUCCESS, messages : messages.success , data: rows})
            }
        })
    }


}

module.exports = new userModel();