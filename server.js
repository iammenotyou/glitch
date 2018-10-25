// init project pkgs
const express = require('express');
const ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const Map = require('es6-map');
const moment = require('moment');
var dateTime = require('node-datetime');
const momenttimezone = require('moment-timezone');

const cleancapital = 0;
const cleancount = 0;

// Pretty JSON output for logs
const prettyjson = require('prettyjson');
const toSentence = require('underscore.string/toSentence');

app.use(bodyParser.json({type: 'application/json'}));
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

// Handle webhook requests
app.post('/', function(req, res, next) {
  // Log the request headers and body to help in debugging.
  // Check the webhook requests coming from Dialogflow by clicking the Logs button the sidebar.
  logObject('Request headers: ', req.headers);
  logObject('Request body: ', req.body);
    
  // Instantiate a new API.AI assistant object.
  const assistant = new ApiAiAssistant({request: req, response: res});

  // Declare our action parameters
  const PRICE_ACTION = 'price'; 
  const STATUS_ACTION = 'status';
  
  //create variables for our code
  const maxtime = 62;
  
  // Create functions to handle price query
  function getPrice(assistant) {
    console.log('** Handling action: ' + PRICE_ACTION);
    let requestURL = 'https://blockchain.info/q/24hrprice';
    request(requestURL, function(error, response) {
      if(error) {
        console.log("got an error: " + error);
        next(error);
      } else {        
        let price = response.body;

        logObject('the current bitcoin price: ' , price);
        // Respond to the user with the current temperature.
        assistant.tell("The current bitcoin price is " + price);
      }
    });
  }
  
  // Create functions to get/return door status
  function getStatus(assistant) {
    console.log('** Handling action: ' + STATUS_ACTION);
    
    //Get total bitcoin
    let requestURLa = 'https://blockchain.info/q/totalbc';
    request(requestURLa, function(errora, responsea) {
      if(errora) {
        console.log("got an error: " + errora);
        next(errora);
      } else {        
        let totalcount = responsea.body;
        var cleanCount = totalcount.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')/1000000000000;
        cleanCount = Number(cleanCount).toFixed(0);
        logObject('the total bitcoin in trillions: ' , cleanCount);
      }
      
      //Get market capital of bitcoin
        let requestURL = 'https://blockchain.info/q/marketcap';
        request(requestURL, function(error, response) {
        if(error) {
          console.log("got an error: " + error);
          next(error);
        } else {        
        let capital = response.body;
        var cleanCapital = capital/1000000000;
        cleanCapital = Number(cleanCapital).toFixed(0);
          logObject('total capital in billions: ' , cleanCapital);
        }
        
        //get the current time from remote server data was reported
        //let requestURLb = 'http://worldclockapi.com/api/json/est/now';
        let requestURLb =  'http://worldclockapi.com/api/json/est/now';
        request(requestURLb, function(error, response) {
        if(error) {
          console.log("got an error: " + error);
          next(error);
        } else {        
        let time = response.body;
        var cleanTime = time.replace(/[`~!@#$%^&*()_|+\-=?;'",.<>\{\}\[\]]/gi, '');
        logObject('reported at: ' , cleanTime);
       
          
        //Get the acutal current time
        var ntime = moment();
        var time_format = ntime.format('HH:mm:ss');  //add a Z after :ss to get timezone
        console.log(time_format);
          
        var jDate = ntime.tz('America/Toronto').format('HH:mm:ss');  // Get EST
        console.log(jDate);
                  
        //compare reported time to actual time
        var ms = moment(jDate,"HH:mm:ss").diff(moment(cleanTime,"HH:mm:ss"));
        var d = moment.duration(ms);
        var s = d.asMinutes();
        s = Number((s).toFixed(0));
        //Tell assistant the message        
        assistant.tell("total capital is: " + cleanCapital + " and the count is " + cleanCount + " reported " + s + " minutes ago");
        }
        
    }); //close first request for data 
    }); //close 2nd request for data
    }); //close third request for data

  }
  
  // Add handler functions to the action router.
  let actionRouter = new Map();
  actionRouter.set(PRICE_ACTION, getPrice);
  actionRouter.set(STATUS_ACTION, getStatus);
  
  // Route requests to the proper handler functions via the action router.
  assistant.handleRequest(actionRouter);
});


// Handle errors
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Oppss... could not check the bitcoin price');
})

// Pretty print objects for logging
function logObject(message, object, options) {
  console.log(message);
  console.log(prettyjson.render(object, options));
}

// Listen for requests
let server = app.listen(process.env.PORT, function () {
  console.log('--> Our Webhook is listening on ' + JSON.stringify(server.address()));
});
