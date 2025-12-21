const express = require('express');
const path = require('path');
const router = express.Router()

router.get('/parcel', (req, res)=>{
    res.sendFile( path.join(__dirname, '../data/parcel/parcel.json'));
});

module.exports=router

