const m = require('./utilities/message')
const express = require('express')
require('dotenv').config();
const app_routing = require('./modules/app-routing');

const app = express();
const port = process.env.port || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app_routing.v1(app);


app.listen(port,()=>{
    console.log("Server running on port :",port);
})