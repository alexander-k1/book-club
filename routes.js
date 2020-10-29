"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
const mongo = require("mongodb").MongoClient;
const LocalStrategy = require("passport-local");
const app = express();
const bcrypt = require("bcrypt");
const ObjectID = require("mongodb").ObjectID;
const { Int32 } = require("mongodb");

module.exports = function(app, db) {
  app.get("/", (req, res) => {
    const mainAgg = req.user
      ? [
          {
            $match: {
              username: {
                $ne: req.user.username //do not show the user their one books
              }
            }
          },
          {
            $project: {
              swaps: 0
            }
          },
          {
            $project: {
              id: "$_id",
              name: "$name",
              username: "$username"
            }
          }
        ]
      : [
          //if not authenticated, show all books
          {
            $project: {
              swaps: 0
            }
          },
          {
            $project: {
              id: "$_id",
              name: "$name",
              username: "$username"
            }
          }
        ];
    db.db()
      .collection("bookclub-books")
      .aggregate(mainAgg)
      .toArray((err, doc) => {
        if (err) {
          console.log(err);
        } else {
          res.render(process.cwd() + "/views/main.pug", {
            authenticated: req.isAuthenticated(),
            currentPage: "/",
            usrName: req.user ? req.user.username : "",
            booksColl: doc
          });
        }
      });
  });
  app.get("/signup", ensureNotAuthenticated, (req, res) => {
    res.render(process.cwd() + "/views/signup.pug", {
      authenticated: req.isAuthenticated(),
      currentPage: "/signup"
    });
  });
  app.get("/login", ensureNotAuthenticated, (req, res) => {
    res.render(process.cwd() + "/views/login.pug", {
      authenticated: req.isAuthenticated(),
      currentPage: "/login"
    });
  });
  app.get("/book/:bookid", ensureAuthenticated, (req, res) => {
    db.db()
      .collection("bookclub-books")
      .findOne({ _id: new ObjectID(req.params.bookid) }, (err, book) => {
        if (err) {
          console.log(err);
        } else if (!book) {
          res.json("Error");
        } else {
          db.db()
            .collection("bookclub-books")
            .find({ username: req.user.username })
            .toArray((err, booksColl) => {
              if (err) {
                console.log(err);
              } else {
                res.render(process.cwd() + "/views/swap.pug", {
                  authenticated: req.isAuthenticated(),
                  currentPage: "/book",
                  usrName: req.user ? req.user.username : "",
                  usrBooks: booksColl,
                  bookName: book.name,
                  bookId: req.params.bookid
                });
              }
            });
        }
      });
  });
  app.post("/api/infoupdate", ensureAuthenticated, (req, res) => {
    db.db()
      .collection("bookclub-users")
      .findOneAndUpdate(
        { username: req.user.username },
        {
          $set: {
            fullname: req.body.editname,
            city: req.body.editcity,
            country: req.body.editcountry
          }
        },
        (err, doc) => {
          if (err) {
            res.send("Error");
          } else if (!doc.value) {
            res.send("Unsuccessful");
          } else {
            res.redirect("/profile");
          }
        }
      );
  });
  app.post("/api/addbook", ensureAuthenticated, (req, res) => {
    if (req.body.addbooktitle.trim() == "") {
      res.send("Error");
    } else {
      db.db()
        .collection("bookclub-books")
        .insertOne(
          {
            username: req.user.username,
            name: req.body.addbooktitle,
            swaps: []
          },
          (err, doc) => {
            if (err) {
              res.send("Error");
            } else if (!doc) {
              res.send("Unsuccessful");
            } else {
              res.redirect("/profile");
            }
          }
        );
    }
  });
  app.post("/api/deletebook", ensureAuthenticated, (req, res) => {
    db.db()
      .collection("bookclub-books")
      .deleteOne(
        { _id: new ObjectID(req.body.id), username: req.user.username },
        (err, result) => {
          if (err) {
            res.json("Error");
          } else {
            res.json("OK");
          }
        }
      );
  });
  app.post("/api/rejectoffer", ensureAuthenticated, (req, res) => {
    return new Promise((resolve, reject) => {
      db.db()
        .collection("bookclub-books")
        .findOneAndUpdate(
          {
            _id: new ObjectID(req.body.ownbookid),
            username: req.user.username
          },
          { $pull: { swaps: { _id: new ObjectID(req.body.booktorejectid) } } },
          (err, result) => {
            if (err) {
              console.log(err);
              res.json("Error");
              resolve(null);
            } else if (!result.value) {
              res.json("Error");
              resolve(null);
            } else {
              resolve(true);
            }
          }
        );
    })

      .then(result => {
        if (result) {
          return new Promise((resolve, reject) => {
            db.db()
              .collection("bookclub-users")
              .findOneAndUpdate(
                { username: req.user.username },
                {
                  $push: {
                    history: {
                      $each: [
                        {
                          type: "ref",
                          ownbookname: req.body.ownbookname,
                          name: req.body.booktorejectname,
                          username: req.body.booktorejectusername
                        }
                      ],
                      $position: 0 //insert at the beginning of history array
                    }
                  }
                },
                (err, result) => {
                  if (err) {
                    console.log(err);
                    resolve(null);
                  } else if (!result.value) {
                    resolve(null);
                  } else {
                    resolve(true);
                  }
                }
              );
          });
        }
      })
      .then(() => {
        db.db()
          .collection("bookclub-users")
          .findOneAndUpdate(
            { username: req.body.booktorejectusername },
            {
              $push: {
                history: {
                  $each: [
                    {
                      type: "ownref",
                      ownbookname: req.body.booktorejectname,
                      name: req.body.ownbookname,
                      username: req.user.username
                    }
                  ],
                  $position: 0 //insert at the beginning of history array
                }
              }
            },
            (err, result) => {
              res.json("OK");
            }
          );
      });
  });
  /*app.get("/api/test", (req, res) => {
    db.db()
      .collection("bookclub-books")
      .findOne({ _id: new ObjectID(req.query.id) }, (err, result) => {
        if (err) {
          console.log(err);
        } else if (!result) {
          console.log(result);
        } else {
          res.json(result);
        }
      });
  });*/
  app.post("/api/acceptoffer", ensureAuthenticated, (req, res) => {
    return new Promise((resolve, reject) => {
      db.db()
        .collection("bookclub-books")
        .findOne(//check that a request for a swap really exists
          {
            _id: new ObjectID(req.body.ownbookid),
            username: req.user.username,
            "swaps._id": new ObjectID(req.body.booktoobtainid),
            "swaps.username": req.body.booktoobtainusername
          },
          (err, result) => {
            if (err) {
              console.log(err);
              res.json("Error");
              resolve(null);
            } else if (!result) {
              res.json("Error");
              resolve(null);
            } else {//if yes, then remove the offered book from the collection
              db.db()
                .collection("bookclub-books")
                .findOneAndDelete(
                  {
                    _id: new ObjectID(req.body.booktoobtainid),
                    username: req.body.booktoobtainusername
                  },
                  (err, doc) => {
                    if (err) {
                      console.log(err);
                      res.json("Error");
                      resolve(null);
                    } else if (!doc.value) {
                      res.json("Error");
                      resolve(null);
                    } else {
                      resolve(true);
                    }
                  }
                );
            }
          }
        );
    })
      .then(result => {
        if (result) {
          return new Promise((resolve, reject) => {
            db.db()
              .collection("bookclub-users")
              .findOneAndUpdate(//update history
                { username: req.body.booktoobtainusername },
                {
                  $push: {
                    history: {
                      $each: [
                        {
                          type: "deal",
                          ownbookname: req.body.booktoobtainname,
                          name: req.body.ownbookname,
                          username: req.user.username
                        }
                      ],
                      $position: 0
                    }
                  }
                },
                (err, result) => {
                  if (err) {
                    console.log(err);
                    res.json("Error");
                    resolve(null);
                  } else if (!result.value) {
                    res.json("Error");
                    resolve(null);
                  } else {
                    resolve(true);
                  }
                }
              );
          });
        }
      })
      .then(result => {
        if (result) {
          return new Promise((resolve, reject) => {
            db.db()
              .collection("bookclub-books")
              .findOneAndDelete(//remove the other books from the collection
                {
                  _id: new ObjectID(req.body.ownbookid),
                  username: req.user.username
                },
                (err, doc) => {
                  if (err) {
                    console.log(err);
                    res.json("Error");
                    resolve(null);
                  } else if (!doc.value) {
                    res.json("Error");
                    resolve(null);
                  } else {
                    resolve(true);
                  }
                }
              );
          });
        }
      })
      .then(result => {
        if (result) {
          return new Promise((resolve, reject) => {
            db.db()
              .collection("bookclub-users")
              .findOneAndUpdate(//update history
                { username: req.user.username },
                {
                  $push: {
                    history: {
                      $each: [
                        {
                          type: "deal",
                          ownbookname: req.body.ownbookname,
                          name: req.body.booktoobtainname,
                          username: req.body.booktoobtainusername
                        }
                      ],
                      $position: 0
                    }
                  }
                },
                (err, result) => {
                  if (err) {
                    console.log(err);
                    res.json("Error");
                    resolve(null);
                  } else if (!result.value) {
                    res.json("Error");
                    resolve(null);
                  } else {
                    resolve(true);
                  }
                }
              );
          });
        }
      })
      .then(result => {
        if (result) {
          db.db()
            .collection("bookclub-users")//update history of those whose swap requests have been rejected
            .bulkWrite(sendRejectsOnAccept(req), (err, result) => {
              if (err) {
                console.log(err);
                res.json("OK");
              } else {
                res.json("OK");
              }
            });
        }
      });
  });
  function sendRejectsOnAccept(req) {
    let bulkWriteArr = [];
    req.body.rejected.forEach(ele => {
      bulkWriteArr.push({
        updateOne: {
          filter: { username: ele.booktorejectusername },
          update: {
            $push: {
              history: {
                $each: [
                  {
                    type: "ownref",
                    ownbookname: ele.booktorejectname,
                    name: req.body.ownbookname,
                    username: req.user.username
                  }
                ],
                $position: 0
              }
            }
          }
        }
      });
    });
    //console.log(bulkWriteArr);
    return bulkWriteArr;
  }
  app.get("/api/users", (req, res) => {//used to check whether the username is already used or not
    let nameRegex = new RegExp("^" + req.query.username, "i");
    db.db()
      .collection("bookclub-users")
      .find({ username: nameRegex }, { projection: { username: 1 } })
      .toArray((err, doc) => {
        if (err) {
          console.log(err);
          res.json("Error");
        } else {
          res.json(doc);
        }
      });
  });
  app.get("/api/requests", ensureAuthenticated, (req, res) => {//used to check whether a similar request already exists
    console.log(req.query);
    const requestsAgg = [
      {
        $match: {
          "swaps.username": req.user.username,
          "swaps._id": new ObjectID(req.query.booktooffer),
          _id: new ObjectID(req.query.booktoobtain)
        }
      },
      {
        $project: {
          swaps: {
            $filter: {
              input: "$swaps",
              as: "swaps",
              cond: {
                $eq: ["$$swaps._id", new ObjectID(req.query.booktooffer)]
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0
        }
      }
    ];
    db.db()
      .collection("bookclub-books")
      .aggregate(requestsAgg)
      .toArray((err, doc) => {
        if (err) {
          console.log(err);
          res.json("Error");
        } else {
          console.log(doc[0])
          res.json(doc);
        }
      });
  });
  app.post("/api/:bookid/swap", ensureAuthenticated, function(req, res) {//deal with swap requests
    return new Promise((resolve, reject) => {
      db.db()
        .collection("bookclub-books")
        .findOne(//check if the book exists
          {
            _id: new ObjectID(req.body.booktooffer),
            username: req.user.username
          },
          { projection: { swaps: 0 } },
          (err, bookToOffer) => {
            if (err) {
              console.log(err);
              res.json("Error");
              resolve(null);
            } else if (!bookToOffer) {
              res.json("Error");
              resolve(null);
            } else {
              resolve(bookToOffer);
            }
          }
        );
    })

      .then(bookToOffer => {
        if (bookToOffer) {
          return new Promise((resolve, reject) => {
            db.db()
              .collection("bookclub-books")
              .findOneAndUpdate(//add to the swap list
                { _id: new ObjectID(req.params.bookid) },
                { $push: { swaps: bookToOffer } },
                { projection: { swaps: 0 } },
                (err, bookToObtain) => {
                  if (err) {
                    console.log(err);
                    res.json("Error");
                    resolve(null);
                  } else if (!bookToObtain.value) {
                    res.json("Error");
                    resolve(null);
                  } else {
                    resolve([bookToOffer, bookToObtain.value]);
                  }
                }
              );
          });
        }
      })
      .then(books => {
        if (books) {
          return new Promise((resolve, reject) => {
            db.db()
              .collection("bookclub-users")
              .findOneAndUpdate(//update history
                { username: req.user.username },
                {
                  $push: {
                    history: {
                      $each: [
                        {
                          type: "req",
                          ownbookname: books[0].name,
                          name: books[1].name,
                          username: books[1].username
                        }
                      ],
                      $position: 0
                    }
                  }
                },
                (err, user) => {
                  if (err) {
                    console.log(err);
                    res.json("Error");
                    resolve(null);
                  } else if (!user.value) {
                    res.json("Error");
                    resolve(null);
                  } else {
                    resolve(books);
                  }
                }
              );
          });
        }
      })
      .then(books => {
        if (books) {
          db.db()
            .collection("bookclub-users")
            .findOneAndUpdate(//update history
              { username: books[1].username },
              {
                $push: {
                  history: {
                    $each: [
                      {
                        type: "ownreq",
                        ownbookname: books[1].name,
                        name: books[0].name,
                        username: books[0].username
                      }
                    ],
                    $position: 0
                  }
                }
              },
              (err, user) => {
                if (err) {
                  console.log(err);
                  res.json("Error");
                } else if (!user.value) {
                  res.json("Error");
                } else {
                  res.redirect("/profile");
                }
              }
            );
        }
      });
  });
  app.post(
    "/api/login",
    passport.authenticate("local", { failureRedirect: "/login" }),
    function(req, res) {
      res.redirect("/");
    }
  );
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/");
  }
  function ensureNotAuthenticated(req, res, next) {//used in signup and login routes
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect("/");
  }
  app.route("/profile").get(ensureAuthenticated, function(req, res) {
    const profileAgg = [
      {
        $match: {//obtain user info
          username: req.user.username
        }
      },
      {
        $project: {
          _id: 0,
          fullname: 1,
          city: 1,
          country: 1
        }
      }
    ];
    return new Promise((resolve, reject) => {
      db.db()
        .collection("bookclub-users")
        .aggregate(profileAgg)
        .toArray((err, doc) => {
          if (err) {
            console.log(err);
            resolve({});
          } else {
            //console.log(doc[0]);
            resolve(doc[0]);
          }
        });
    })
      .then(result => {
        return new Promise((resolve, reject) => {
          db.db()
            .collection("bookclub-books")
            .find(//obtain the user's books
              { username: req.user.username },
              { projection: { username: 0 } }
            )
            .toArray((err, doc) => {
              if (err) {
                console.log(err);
                resolve([result, {}]);
              } else if (!doc) {
                resolve([result, {}]);
              } else {
                //console.log(doc);
                resolve([result, doc]);
              }
            });
        });
      })
      .then(results => {
        res.render(process.cwd() + "/views/profile.pug", {
          usrName: req.user.username,
          currentPage: "/profile",
          authenticated: req.isAuthenticated(),
          pInfo: results[0],
          books: results[1]
        });
      });
  });
  app.get("/api/userhistory", (req, res) => {
    let page = new Int32((Number(req.query.page) - 1) * 10);
    const historyAgg = [//obtain 10 records from the user history starting from "page"
      {
        $match: {
          username: req.user.username
        }
      },
      {
        $project: {
          _id: 0,
          history: {
            $slice: ["$history", page, 10]
          },
          historypages: {
            $ceil: {
              $divide: [
                {
                  $size: "$history"
                },
                10
              ]
            }
          }
        }
      }
    ];
    db.db()
      .collection("bookclub-users")
      .aggregate(historyAgg)
      .toArray((err, doc) => {
        if (err) {
          console.log(err);
          res.json(err);
        } else {
          res.json(doc[0]);
        }
      });
  });
  app.route("/api/logout").get((req, res) => {
    req.logout();
    res.redirect("/");
  });
  app.route("/api/signup").post(
    (req, res, next) => {
      let usernameRegex = /[A-Za-z0-9_]{6,}/;
      let passwordRegex = /[A-Za-z0-9_]{8,}/;
      if (
        !usernameRegex.test(req.body.username) ||
        !passwordRegex.test(req.body.password)
      ) {
        res.send("Error");
      } else {
        let nameRegex = new RegExp("^" + req.body.username, "i");//case insensitive search
        db.db()
          .collection("bookclub-users")
          .findOne({ username: nameRegex }, function(err, user) {
            if (err) {
              next(err);
            } else if (user) {
              res.redirect("/");
            } else {
              bcrypt.hash(req.body.password, 12, function(err, hash) {
                db.db()
                  .collection("bookclub-users")
                  .insertOne(
                    {
                      username: req.body.username,
                      password: hash,
                      fullname: "",
                      city: "",
                      country: "",
                      history: []
                    },
                    (err, doc) => {
                      if (err) {
                        res.redirect("/");
                      } else {
                        //console.log(user);
                        console.log("registered");
                        //console.log(doc.ops[0]);
                        next(null, user);
                      }
                    }
                  );
              });
            }
          });
      }
    },
    passport.authenticate("local", { failureRedirect: "/" }),
    (req, res, next) => {
      //res.render(process.cwd() + '/views/pug/profile.pug', {username: req.user.username});
      res.redirect("/profile");
    }
  );
  app.use((req, res, next) => {
    res
      .status(404)
      .type("text")
      .send("Not Found");
  });
  const listener = app.listen(process.env.PORT, () => {
    console.log("Your app is listening on port " + listener.address().port);
  });
};
