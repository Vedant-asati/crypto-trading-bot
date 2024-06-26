const jwt = require("jsonwebtoken");
const User = require("../Models/userModel");
const create = require("prompt-sync");
const mongoose = require('mongoose');
// const { cookies } = require('next/headers');
// import { cookies } from 'next/headers';

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
}
const createNSendToken = (user, statusCode, req, res) => {
    const token = signToken(user.id);
    console.log("token", token);
    // res.cookie("jwt", token, {
    //     expires: new Date(
    //         Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 1000
    //     ),
    //     httpOnly: true,
    //     secure: req.secure || req.headers["x-forwarded-proto"] == "https",
    // });

    //Remove pwd from output
    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user,
        },
    });
};

const signUp = async (req, res, next) => {
    try {
        // DB connection
        const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);
        mongoose.connect(DB, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: true,
        }).then(() => {
            console.log("JSR! DB connected.");
        }).catch((err) => console.log("JSR! DB not connected. ", err));

        const newUser = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            confirmPassword: req.body.confirmPassword,
        });
        console.log("newUser", newUser);

        // 201 - Created 
        createNSendToken(newUser, 201, req, res);
        mongoose.disconnect();
    } catch (error) {
        if (error.code == 11000) {
            // 400 - Bad Request
            return res.status(400).json({
                status: "fail",
                message: "User already exists",
            });
        }
        // 400 - Bad Request
        return res.status(400).json({
            status: "fail",
            message: error.message,
        });
    }
};
const login = async (req, res, next) => {
    // DB connection
    const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);
    mongoose.connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: true,
    }).then(() => {
        console.log("JSR! DB connected.");
    }).catch((err) => console.log("JSR! DB not connected. ", err));

    const { email, password } = req.body;

    if (!email || !password) {
        // 400 - Bad Request
        return res.status(400).json({
            status: "fail",
            message: "Please provide email and password",
        });
    };

    const foundUser = await User.findOne({ email }).select("+password");
    console.log(foundUser);
    if (!foundUser || !(await foundUser.checkPassword(password, foundUser.password))) {
        // 401 - Unauthorized
        return res.status(401).json({
            status: "fail",
            message: "Incorrect email or password",
        });
    }
    // 200 - Ok
    createNSendToken(foundUser, 200, req, res);
    mongoose.disconnect();
};
const buyMembership = async (req, res, next) => {
    // DB connection
    const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);
    mongoose.connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: true,
    }).then(() => {
        console.log("JSR! DB connected.");
    }).catch((err) => console.log("JSR! DB not connected. ", err));
    
    const updatedUser = await User.findByIdAndUpdate(
        req.body.userId, {
        membershipType: req.body.membershipType,
    }, {
        new: true,
        runValidators: true,
    });
    // 200 - Ok
    res.status(200).json({
        status: "success",
        message: "Subscribed",
        title: "Your account",
        user: updatedUser,
    });
    mongoose.disconnect();
};


module.exports = {
    signUp,
    login,
    buyMembership,
}

