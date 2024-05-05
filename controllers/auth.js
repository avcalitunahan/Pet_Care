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

    const {name, surname, username, email, password, passwordConfirm, city, petType} = req.body;

    
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


        db.query('INSERT INTO users SET ?', {name: name, surname:surname, username: username, email: email, password: hashedPassword, city: city, pet_type:petType}, (error, results) =>{
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

    db.query('SELECT * FROM users WHERE email = ? OR username = ?', [usernameOrEmail,usernameOrEmail], (error, results)=> {
        if(error) {
            console.log(error);
        }

        const user = results[0];

        if (!user || !bcrypt.compareSync(password, user.password)) {
          return res.redirect("/login");      
        }

        const accessToken = jwt.sign({ id: user.id }, process.env.SECRET_KEY);
       
        req.session.user = {...user, accessToken};

        
        

        if(req.session && req.session.user && req.session.user.accessToken && req.session.user.accessToken !== "") {
            return res.redirect("/home");
        }
        else {
            return res.redirect("/login");
        }
    });
};


exports.logout = (req, res) => {
    req.session.destroy((err) =>{
        if(err) {
            console.error(err);
            return res.sendStatus(500);
        }

        res.clearCookie("accessToken");

        res.redirect("/login");
    });
};

exports.profile = async (req, res) => {
    const { city, petType } = req.body;
    const userId = req.session.user.id;

    try {
        // Profil var mı kontrol et
        const existingProfile = await db.query('SELECT * FROM user_profile WHERE user_id = ?', [userId]);

        if (existingProfile.length > 0) {
            // Profil var, güncelle
            await db.query('UPDATE user_profile SET city = ?, pet_type = ? WHERE user_id = ?', [city, petType, userId]);
        } else {
            // Profil yok, ekle
            await db.query('INSERT INTO user_profile (user_id, city, pet_type) VALUES (?, ?, ?)', [userId, city, petType]);
        }

        res.redirect("/profile");
        
    } catch (err) {
        console.error("Profil bilgileri güncellenirken bir hata oluştu:", err);
        res.status(500).send("Bir hata oluştu, lütfen tekrar deneyin.");
    }
};





