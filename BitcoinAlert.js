import * as R from 'ramda';
import axios from 'axios';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Configuration pour Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false  // Ignorer les erreurs de certificat
    }
});


// Fonction pour envoyer un e-mail
const sendAlertEmail = (message) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_TO,
        subject: 'Alerte Bitcoin',
        text: message
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};

// Fonction pour récupérer le prix du Bitcoin
const fetchBitcoinPrice = async () => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        return R.path(['data', 'bitcoin', 'usd'], response);
    } catch (error) {
        console.error('Failed to fetch bitcoin price', error);
        return null;
    }
};

let lastPrice = null;
const threshold = 5; // Seuil de changement de prix en pourcentage

// Fonction pour vérifier les changements de prix
const checkPriceChange = async () => {
    const currentPrice = await fetchBitcoinPrice();
    if (lastPrice != null && Math.abs((currentPrice - lastPrice) / lastPrice * 100) >= threshold) {
        sendAlertEmail(`Alerte Bitcoin: Changement de prix significatif détecté! Prix actuel: $${currentPrice}`);
    }
    lastPrice = currentPrice;
};

// Vérifie le prix toutes les 300 secondes (5min)
setInterval(checkPriceChange, 300000);
