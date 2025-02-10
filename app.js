if(process.env.NODE_ENV != "production"){
  require('dotenv').config();
}

console.log(process.env);

const express = require("express");
const app= express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js")
const MONGO_URL ="mongodb://127.0.0.1:27017/wanderlust"
const path = require("path");
const methodOverride = require("method-override");
const ejsMate= require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { wrap } = require("module");
const{listingSchema, reviewSchema}= require("./schema.js");
const Review= require("./models/review.js");
const session= require("express-session");
const flash= require("connect-flash");
const passport = require("passport"); 
const localStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter= require("./routes/listing.js");
const reviewRouter= require("./routes/review.js");
const userRouter= require("./routes/user.js");

main()
  .then(()=>{
    console.log("Connected to MongoDB");
  })
  .catch((err)=>{
    console.log(err);
  });
async function main() {
    await mongoose.connect(MONGO_URL);
  
    // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
  }

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "public")));

const sessionOptons={
  secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie:{
    expires: Date.now() +7*24*60*60*1000,
    maxAge:7*24*60*60*1000,
    httpOnly:true,
  }
};

// app.get("/", (req,res)=>{
//     res.send("Hi, Iam root");
// });

app.use(session(sessionOptons));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
  res.locals.success= req.flash("success");
  res.locals.error= req.flash("error");
  res.locals.currUser= req.user;
  next();
});

// app.get("/demouser",async(req,res)=>{
//   let fakeuser = new User({
//     email: "student@gmail.com",
//     username: "delta-student"
//   })
//  let registeredUser = await User.register(fakeuser,"helloworld");
//  res.send(registeredUser);
// })

app.use("/listings", listingRouter)
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);



app.all("*", (req, res, next)=>{
  next(new ExpressError(404, "Page not found"));
});

app.use((err, req, res, next)=>{
  let {statusCode=500, message="something went wrong"}= err;
  res.render("error.ejs",{message});
});

app.listen(8080,()=> {
    console.log("server is listening to port 8080");
});