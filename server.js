const express = require("express");
const session = require("express-session");
const path = require("path");
const mysql = require("mysql");
const dotenv = require("dotenv");


dotenv.config({path:'./.env'});

const app = express();


app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {secure: true} //https üzerinden olurken true
}))

const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.set('view engine', 'hbs');


app.use("/", require("./routes/pages"));
app.use("/auth", require("./routes/auth"));

app.listen(3000, () => {
    console.log("Server started on Port 8080");
});