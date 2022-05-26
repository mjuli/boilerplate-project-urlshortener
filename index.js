require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
let bodyParser = require('body-parser');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

const Schema = mongoose.Schema;

mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true });

const urlSchema = new Schema({
  original: { type: String, required: true },
  short: { type: Number }
});

let Url = mongoose.model("Url", urlSchema);

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function(req, res) {
  const original_url = req.body.url

  let urlRegex = /https:\/\/|http:\/\//g;

  if(urlRegex.test(original_url)){
    let shortUrlResponse = { original_url }

    Url
      .findOne({ original: original_url })
      .exec()
      .then(data => {
        if(data){
          shortUrlResponse.short_url = data.short

          res.json(shortUrlResponse)
        } else {
          Url
            .find()
            .estimatedDocumentCount()
            .exec()
            .then((count) => {
              new Url({
                short: count + 1,
                original: original_url
              })
              .save()
              .then(() => {
                shortUrlResponse.short_url = count + 1

                res.json(shortUrlResponse)
              })
              .catch(err => {
                res.json(err);
              });
            })
            .catch(err => {
              res.json(err);
            });
        }
      })
      .catch(err => {
        res.json(err);
      });
  } else {
    res.json({"error":"invalid URL"})
  }
});

app.get('/api/shorturl/:short', function(req, res) {
  Url
    .find({ short: req.params.short })
    .exec()
    .then(url => {
      res.redirect(url[0]["original"]);
    })
    .catch(err => {
      res.json(err);
    });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
