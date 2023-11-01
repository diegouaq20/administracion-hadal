const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { db } = require("./firebase");
const { checkAuthentication } = require("./inicio-sesion");