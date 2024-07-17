require('dotenv').config();

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const methodOverride=require('method-override');
const connectDB=require('./server/config/db');
const session=require('express-session');
const passport=require('passport');
const MongoStore=require('connect-mongo');

const app = express();
const port = 5000 || process.env.PORT;

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    })
}))

app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride("_method"));

// Database Connection
connectDB();


// Static Files
app.use(express.static('public'));

// Templating Engine
app.use(expressLayouts);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// Routing
app.use('/',require('./server/routes/auth'));
app.use('/',require('./server/routes/dashboard'));
app.use('/',require('./server/routes/index'));

// Handle Errors
app.get('*',(req,res)=>{
    res.status(404).render("error404");
})

app.listen(port,()=>{
    console.log(`App is listening on port ${port}`);
})