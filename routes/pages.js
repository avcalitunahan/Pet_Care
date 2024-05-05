const express = require("express");
const router = express.Router();
const mysql = require("mysql");
const { getCityWeather, openAiRequest, getPetNews } = require('../api');

const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'];

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB
});
//Middleware Functions
const checkLoggedIn = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.accessToken && req.session.user.accessToken !== "") {
        next();
    } else {
        res.redirect("/login");
    }
};


router.get("/", (req, res) => {
    res.render('about');
});

router.get("/login", (req, res) => {
    res.render("login");
});

router.get("/register", (req, res) => {
    res.render("register",{cities:cities});
});

router.get("/home", checkLoggedIn, (req, res) => {
    
    res.render("home");
});

router.get("/profile", checkLoggedIn, (req, res) => {
    
    getCityWeather(req.session.user.city)
        .then(weatherData => {
            const prompt = `${weatherData.description} ${weatherData.temp} ${req.session.user.petType} Belirtilen evcil hayvan türüne sahip bir bu hava koşullarında neler yapabilir ? max token:500  ve cümleyi bitmiş döndür `;
            openAiRequest(prompt)
                .then(adviceResponse => {
                    res.render('profile', { 
                        name: req.session.user.name,
                        surname: req.session.user.surname,
                        username: req.session.user.username,
                        email: req.session.user.email,
                        city: req.session.user.city,
                        petType: req.session.user.pet_type,
                        weatherData,
                        adviceResponse
                    });
                })
                .catch(error => {
                    console.error('Öneri alınırken bir hata oluştu:', error);
                    res.status(500).send('Öneri alınırken bir hata oluştu');
                });
        })
        .catch(error => {
            console.error('Hava durumu bilgileri alınırken bir hata oluştu:', error);
            res.status(500).send('Hava durumu bilgileri alınırken bir hata oluştu');
        });
    
});

router.get("/news", async (req, res) => {
    try {
        const articlesWithTranslation = await getPetNews();
        res.render('news', { articles: articlesWithTranslation });
    } catch (error) {
        console.error('Haberler alınırken bir hata oluştu:', error);
        res.status(500).send('Haberler alınırken bir hata oluştu');
    }
});


router.get("/bakim", (req, res) => {
    res.render("bakim");
});

router.get("/kedi_urunleri", (req, res) => {
    res.render("kedi_urunleri");
});

router.get("/kopek_urunleri", (req, res) => {
    res.render("kopek_urunleri");
});







router.get("/about", (req, res) => {
    res.render("about");
});

router.get("/blog", (req, res) => {
    res.render("blog");
});


module.exports = router;