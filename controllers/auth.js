const express = require("express");
const sql = require("mssql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB,
    options: {
        encrypt: true,
        enableArithAbort: true
    }
}

let pool;

(async () => {
    try {
        pool = await sql.connect(dbConfig);
        console.log('Connected to SQL Server');
    } catch (err) {
        console.error('Error connecting to SQL Server:', err);
    }
})();

exports.register = async (req, res) => {
    const {name, surname, username, email, password, passwordConfirm, city, petType} = req.body;

    try {
        const existingUser = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT email FROM users WHERE email = @email');

        if (existingUser.recordset.length > 0) {
            return res.render('register', {
                message: 'That email already in use'
            });
        } else if (password !== passwordConfirm) {
            return res.render('register', {
                message: 'Passwords do not match.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.request()
            .input('name', sql.VarChar, name)
            .input('surname', sql.VarChar, surname)
            .input('username', sql.VarChar, username)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, hashedPassword)
            .input('city', sql.VarChar, city)
            .input('petType', sql.VarChar, petType)
            .query('INSERT INTO users (name, surname, username, email, password, city, pet_type) VALUES (@name, @surname, @username, @email, @password, @city, @petType)');
        
        return res.render('register', {
            message: 'User registered'
        });
    } catch (err) {
        console.error('Error registering user:', err);
        return res.status(500).send('An error occurred, please try again.');
    }
};

exports.login = async (req, res) => {
    const {usernameOrEmail, password} = req.body;

    try {
        const user = await pool.request()
            .input('usernameOrEmail', sql.VarChar, usernameOrEmail)
            .query('SELECT * FROM users WHERE email = @usernameOrEmail OR username = @usernameOrEmail');

        if (!user.recordset[0] || !bcrypt.compareSync(password, user.recordset[0].password)) {
            return res.redirect("/login");
        }

        const accessToken = jwt.sign({ id: user.recordset[0].id }, process.env.SECRET_KEY);
        req.session.user = {...user.recordset[0], accessToken};

        if (req.session && req.session.user && req.session.user.accessToken && req.session.user.accessToken !== "") {
            return res.redirect("/home");
        } else {
            return res.redirect("/login");
        }
    } catch (err) {
        console.error('Error logging in:', err);
        return res.status(500).send('An error occurred, please try again.');
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
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
        const existingProfile = await pool.request()
            .input('userId', sql.VarChar, userId)
            .query('SELECT * FROM user_profile WHERE user_id = @userId');

        if (existingProfile.recordset.length > 0) {
            await pool.request()
                .input('city', sql.VarChar, city)
                .input('petType', sql.VarChar, petType)
                .input('userId', sql.VarChar, userId)
                .query('UPDATE user_profile SET city = @city, pet_type = @petType WHERE user_id = @userId');
        } else {
            await pool.request()
                .input('userId', sql.VarChar, userId)
                .input('city', sql.VarChar, city)
                .input('petType', sql.VarChar, petType)
                .query('INSERT INTO user_profile (user_id, city, pet_type) VALUES (@userId, @city, @petType)');
        }

        res.redirect("/profile");
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).send('An error occurred, please try again.');
    }
};







