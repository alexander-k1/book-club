"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const ObjectID = require("mongodb").ObjectID;
const mongo = require("mongodb").MongoClient;
const LocalStrategy = require("passport-local");
const app = express();
const bcrypt = require("bcrypt");
const MongoStore = require("connect-mongo")(session);

module.exports = function(app, db) {
  app.use(
    session({
      store: new MongoStore({ url: process.env.DATABASE }),
      secret: process.env.SESSION_SECRET,
      resave: true,
      saveUninitialized: true
    })
  );

  app.use(passport.initialize());

  app.use(passport.session());

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    db.db()
      .collection("bookclub-users")
      .findOne({ _id: new ObjectID(id) }, (err, doc) => {
        done(null, doc);
      });
  });

  passport.use(
    new LocalStrategy(function(username, password, done) {
      let nameRegex = new RegExp("^" + username, "i");
      db.db()
        .collection("bookclub-users")
        .findOne({ username: nameRegex }, function(err, user) {
          console.log("User " + username + " attempted to log in.");
          if (err) {
            console.log("error");
            return done(err);
          }
          if (!user) {
            console.log("no such user");
            return done(null, false);
          }
          bcrypt.compare(password, user.password, function(err, result) {
            if (result) {
              console.log("user OK");
              return done(null, user);
            } else {
              console.log("user not OK");
              return done(null, false);
            }
          });
        });
    })
  );
};
