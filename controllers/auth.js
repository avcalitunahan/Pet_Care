const express = require("express");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();



const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB
});

db.connect((error) =>{
    if(error) {
        console.log(error)
    }
    else {
        console.log("Database Connected...")
    }
});

exports.register = (req, res) => {
    console.log(req.body);

    const {name, email, password, passwordConfirm} = req.body;

    
    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) =>{
        if(error) {
            console.log(error);
        }

        if(results.length > 0) {
            return res.render('register', {
                message: 'That email already in use'
            });
        }
        else if(password !== passwordConfirm) {
            return res.render('register', {
                message: 'Passwords do not match.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);


        db.query('INSERT INTO users SET ?', {name: name, email: email, password: hashedPassword}, (error, results) =>{
            if(error) {
                console.log(error);
            }
            else {
            return res.render('register', {
                message: 'User registered'
            });
            }
            
        });
    });
}

exports.login = (req, res)=> {
    const {usernameOrEmail, password} = req.body;

    db.query('SELECT * FROM users WHERE email = ? OR name = ?', [usernameOrEmail,usernameOrEmail], (error, results)=> {
        if(error) {
            console.log(error);
        }

        const user = results[0];

        if (!user || !bcrypt.compareSync(password, user.password)) {
          return res.send({status: error, message: 'Invalid credentials' });
        }
    
        const accessToken = jwt.sign({ id: user.id }, process.env.SECRET_KEY);
        
        // Oturum verilerini ayarlayın
        req.session.user = {...user, accessToken};

        if(req.session && req.session.user) {
            res.redirect("/home");
        }
        else {
            res.redirect("/login");
        }
    });
};

