const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require("firebase-admin");
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const port = 5000;

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Firebase Admin Validation
var serviceAccount = require("./configs/burj-al-arab-nongor-soft-firebase-adminsdk-r8ald-5bd80f8139.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `${process.env.FIRE_DB}`
});
// End of Firebase Admin Validation

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gbmds.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const booking = client.db("burjAlArab").collection("bookings");
    
    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        booking.insertOne(newBooking)
        .then(result => {
            res.send(result.insertedCount > 0)
        })
    })

    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        if(bearer && bearer.startsWith('Bearer ')){
            const idToken = bearer.split(' ')[1];

            admin.auth().verifyIdToken(idToken)
            .then(function(decodedToken) {
                const tokenEmail = decodedToken.email;
                const queryEmail = req.query.email;
                if(tokenEmail === queryEmail){
                    booking.find({email: queryEmail})
                    .toArray((err, documents) => {
                        res.send(documents);
                    })
                } else {
                    res.status(401).send('Unauthorized Access');
                }
            })
            .catch(function(error) {
                res.status(401).send('Unauthorized Access');
            });
        } else {
            res.status(401).send('Unauthorized Access');
        }
    })

});

app.get('/', (req, res) => {
    res.send("Hello from Burj-Al-Arab");
})

app.listen(process.env.PORT || port);