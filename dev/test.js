
const Blockchain = require('./blockchain');
const sha256 = require('sha256');
const socialchain = new Blockchain();
const express = require('express');
const res = require('express/lib/response');
const app = express();
app.use(express.json());
 

         socialchain.createNewWallet("ladir");

        console.log(socialchain.userWallet);
