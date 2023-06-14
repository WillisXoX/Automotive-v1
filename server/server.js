const path = require('path');
const express = require('express');
const session = require('express-session');
const sessionStore = new session.MemoryStore();
const mongoose = require('mongoose');
const cors = require('cors');
/* const router = require('express').Router(); */

const app = express();

mongoose.set('strictQuery', false);
mongoose.connect("mongodb://localhost:27017/autoDB");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 5
    },
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

app.use(session({
    secret: 'some secret',
    cookie: {
        maxAge: 300000,
        sameSite: 'none',
        secure: true,
        httpOnly: true
    },
    resave: false,
    saveUninitialized: false,
    store: sessionStore
}));

/* app.use(cors()); */
const root = path.join(__dirname, '../client/automotive/build');
app.use(express.static(root));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

/* app.use((req, res, next) => {
    console.log(root);
    console.log(sessionStore);
    next();
    res.sendFile(path.join(__dirname, '../client/automotive/build', 'index.html'));
}); */


app.get('/time', (req, res) => {
    var d = new Date();
    res.json(d);
});


app.post('/auth', (req, res) => {
    /* console.log('check...'); */
    const session = req.body;
    console.log(req.body);
    if (session && session.session_id in sessionStore.sessions) {
        var d = new Date();

        if (Date.parse(session.cookie.expires) > d) {
            res.status(200).send('Authenticated');
        }else {
            res.status(400).send('Session Expired');
            delete sessionStore.sessions[session.session_id];
        }
        console.log(session.cookie.expires);
        console.log('Logged In');
    }else {
        res.status(400).send({msg: 'Session Not Found'});
    }
});

app.get('/signin', (req, res) => {
    /* console.log('check...'); */
    if (req.session.authenticated) {
        console.log('here');
        const session_id = req.sessionID;
        if (req.sessionID in sessionStore.sessions) {
            const session_data = JSON.parse(sessionStore.sessions[session_id]);
            console.log(session_data.user);
            res.send(session_data.user);
        }
    }else {
        console.log('Not Authenticated');
        res.status(400).send('Not Authenticated');
    }
});

app.post('/signin', (req, res) => {
    const { email, password } = req.body;
    /* res.send('ok'); */
    if (email && password) {
        User.findOne({email: email, password: password}, (err, user) => {
            if (err) {
                console.log(err);
            }else if (!user) {
                console.log('here');
                res.status(400).send({err: 'User Found'});
            }else {
                const {name, email, createdAt, updatedAt} = user;
                req.session.authenticated = true;
                req.session.session_id = req.sessionID;
                console.log(req.session.session_id);
                req.session.user = {
                    name,
                    email,
                    createdAt,
                    updatedAt
                };
                res.json(req.session);
            }
        });
    }else {
        res.status(400).send({err: 'Bad Credentials'});
    }
});

app.post('/signup', (req, res) => {
    const { name, email, password } = req.body;
    if (name && email && password) {
        const user = new User({
            name: name,
            email: email,
            password: password
        });

        console.log(user);

        User.findOne({email: email}, (err, user) => {
            if (err) {
                console.log(err);
            }else if (!user) {

                user.save((err) => {
                    if(err){
                        res.status(400).json(err);
                    }else{
                        res.json('User added!');
                    }
                });
            }else {
                res.status(400).send({err: 'User Found'});
            }
        });
    
    }
});

app.use('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/automotive/build', 'index.html'));
});

app.listen(process.env.PORT || 5000, () => {
    console.log('Listening on port 5000...');
});