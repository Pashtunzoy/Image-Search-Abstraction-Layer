const http = require('http');
const path = require('path');
const Search = require('bing.search');
const mongoose = require('mongoose');
const express = require('express');
const app = express();
require('dotenv').load();


app.use('/public', express.static(process.cwd() + '/public'));

mongoose.connect(process.env.MONGO_URL);
const Schema = mongoose.Schema;
const SearchQueries = new Schema({
  term: String,
  when: { type: Date, default: Date.now }
});


const LatestSearch = mongoose.model('latestSearch', SearchQueries);

const search = new Search(process.env.CUSTOMER_KEY);

app.get('/', (req, res) => {
  res.sendfile(__dirname +'/public/index.html');
});

app.get('/latest', (req, res) => {
  LatestSearch.find().limit(10).sort('-when').select({term: 1, when: 1, _id: 0}).exec((err, data) => {
    if(err) console.log(err);
    if(data) {
      res.send(data);
    }
  });
});

app.get('/:searchText?', (req, res) => {
  search.images(req.params.searchText,
  {top: req.query.offset},
  (err, results) => {
    if(err) console.log(err);
    const result = results.map(data => {
      return {
        'url': data.url,
        'snippet': data.title,
        'thumbnail': data.thumbnail.url,
        'context': data.sourceUrl
        }
    });
    const termToBeSaved = new LatestSearch({ term: req.params.searchText });
    termToBeSaved.save(function (err, term) {
      if (err) return console.error(err);
      if(term) {
        console.log(term);
      }
    });
    res.send(result);
  });
});


app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  console.log("Server listening at", process.env.IP + ":" +process.env.PORT);
});
