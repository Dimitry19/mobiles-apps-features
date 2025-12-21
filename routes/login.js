const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Parser les formulaires
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

 
require("dotenv").config();
const ADMIN_USER = process.env.BASIC_USER || "admin";
const ADMIN_PASS = process.env.BASIC_PASS || "password";


// Formulaire login
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});


// Traiter la soumission du formulaire
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        req.session.isAdmin = true;
        return res.redirect('/admin');
    }

    return res
           .status(401)
           .sendFile(path.join(__dirname, "../public/unauthorized.html"));
});

// Déconnexion
router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;