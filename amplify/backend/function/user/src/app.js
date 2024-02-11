const serverless = require('serverless-http');
const uploadData = require('aws-amplify/storage');
const express = require('express')
const bodyParser = require('body-parser')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const AWS = require('aws-sdk');
const {v4: uuidv1} = require('uuid');
const aws_config = {
  accessKeyId: 'AKIAWIXQJBLS6KPMHMMZ',
  secretAccessKey: 'tdafL+o6JMOIbsMIMVPf8Fos62uS9B0M20jFH8Zm',
  region: 'us-east-1',
};
const axios = require('axios');
const FormData = require('form-data');
const YOUR_DOMAIN = 'http://localhost:3000';
const stripe = require('stripe')('sk_test_tR3PYbcVNZZ796tH88S4VQ2u');
var mysql = require('mysql');





const app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
});
app.use(express.static('public'));

app.get('/user/get-students', function(req, res) {
  AWS.config.update(aws_config);

  const docClient = new AWS.DynamoDB.DocumentClient();

  const params = {
      TableName: 'Students'
  };

  docClient.scan(params, function (err, data) {

    if (err) {
      console.log(err)
      res.send({
        success: false,
        message: err
      });
    } else {
      const { Items } = data;
      res.send({
        success: true,
        students: Items
      });
    }
  });
})

app.get('/user/add-student', function(req, res) {
    AWS.config.update(aws_config);
    const docClient = new AWS.DynamoDB.DocumentClient();
    const Item = {
      student_id : uuidv1(),
      name : req.query.name,
      student_department_id : req.query.student_department_id,
      age : req.query.age
    };
    var params = {
        TableName: 'Students',
        Item: Item
    };

    // Call DynamoDB to add the item to the table
    docClient.put(params, function (err, data) {
        if (err) {
            res.send({
                success: false,
                message: err
            });
        } else {
            res.send({
                success: true,
                message: 'Added Student '+ Item.name,
                student: data
            });
        }
    });
})

app.get('/user', function(req, res) {
  res.json({success: 'My new changes here!', url: req.url});
});

app.get('/user/home', function(req, res) {
  res.json({success: 'Home!', url: req.url});
});

app.get('/user/logout', function(req, res) {
  res.json({success: 'Main', url: req.url});
});



app.get('/set-stripe', async function(req, res) {
  let product = await stripe.products.create({
    name: 'Starter Subscription',
    description: '$12/Month subscription',
  });
  let price = await stripe.prices.create({
    unit_amount: 1200,
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    product: product.id,
  });
  console.log('Success! Here is your starter subscription product id: ' + product.id);
  console.log('Success! Here is your starter subscription price id: ' + price.id);
  res.json({success: 'Main', url: req.url});
});


app.get('/try-stripe', async function(req, res) {
    const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price: 'price_1Oerx9JAJfZb9HEBa7foaKri',
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${YOUR_DOMAIN}/success.html`,
    cancel_url: `${YOUR_DOMAIN}/cancel.html`,
  });

  res.redirect(session.url);
});



app.get('/upload-file', async function(req, res) {
  try {
    const result = await uploadData({
      key: filename,
      data: file,
      options: {
        accessLevel: 'guest', // defaults to `guest` but can be 'private' | 'protected' | 'guest'
        onProgress // Optional progress callback.
      }
    }).result;
    console.log('Succeeded: ', result);
  } catch (error) {
    console.log('Error : ', error);
  }
})

async function salesforce_token() {
  let data = new FormData();
  data.append('username', 'rangbahadur.bind@harbingergroup.com');
  data.append('password', 'rbind403@1sydX88nmpM4l6yfHdsFWi4qk');
  data.append('grant_type', 'password');
  data.append('client_id', '3MVG929eOx29turGiCzj35mE29tyrl4j4OyLWAR0FlJzUoYf9C2FW60_FSrHYq5_Z175R1xE58d5.y8emPMTi');
  data.append('client_secret', '17700138162EF2DB1FECD1DDD9E26D102FE1A895C31C1B3C961F49EC420E9BA7');
  data.append('redirect_uri', 'https://harbingergroup3-dev-ed.develop.lightning.force.com');

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://login.salesforce.com/services/oauth2/token',
    headers: { 
      'Cookie': 'BrowserId=T5A2YcTlEe6lDIstXd9b6A; CookieConsentPolicy=0:0; LSKey-c$CookieConsentPolicy=0:0', 
      ...data.getHeaders()
    },
    data : data
  };

  let response = await axios.request(config);
  return response.data.access_token;
}



app.get('/salesforce-list-users', async function(req, res) {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://harbingergroup3-dev-ed.develop.my.salesforce.com/services/data/v41.0/query?q=SELECT+UserName+FROM+User',
    headers: { 
      'Authorization': `Bearer ${await salesforce_token()}`, 
      'Cookie': 'BrowserId=T5A2YcTlEe6lDIstXd9b6A; CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1'
    }
  };

  let response = await axios.request(config);
  res.json(response.data.records);
})

app.get('/create-salesforce-user', async function(req, res) {
  let data = JSON.stringify({
    "FirstName": "ABC",
    "LastName": "MYTEST",
    "Email": "fariskhtestuser@gmail.com",
    "Username": "fariskhtestuser@gmail.com",
    "AboutMe": "This is about this user",
    "Alias": "Faris2",
    "TimeZoneSidKey": "Asia/Kolkata",
    "LocaleSidKey": "en_IN",
    "EmailEncodingKey": "UTF-8",
    "ProfileId": "00eGA000003Fs2U",
    "LanguageLocaleKey": "en_US"
  });
  
  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://harbingergroup3-dev-ed.develop.my.salesforce.com/services/data/v41.0/sobjects/User',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${await salesforce_token()}`, 
      'Cookie': 'BrowserId=T5A2YcTlEe6lDIstXd9b6A; CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1'
    },
    data : data
  };
  
  let response = await axios.request(config);
  console.log("DATA", JSON.stringify(response.data));
  res.json(response.data);
})


app.get('/update-salesforce-user', async function(req, res) {
  let data = JSON.stringify({
    aboutMe: "About User",
  });
  
  let config = {
    method: 'patch',
    maxBodyLength: Infinity,
    url: 'https://harbingergroup3-dev-ed.develop.my.salesforce.com/services/data/v41.0/chatter/users/005GA00000A3MTUYA3',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${await salesforce_token()}`, 
      'Cookie': 'BrowserId=T5A2YcTlEe6lDIstXd9b6A; CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1'
    },
    data : data
  };

let response = await axios.request(config);
console.log("DATA", JSON.stringify(response.data));
res.json(response.data);
})

app.get('/connect-mysql', async function(req, res) {
  var con = await mysql.createConnection({
    host: "amplify-rds.cvo00sagg8r4.us-east-1.rds.amazonaws.com",
    user: "admin",
    password: "Vmd14152024",
    port: "3306",
    database:"mydb"
  });

  await con.connect(async function(err) {
    if (err) {
      console.log("Error!", JSON.stringify(err));
      res.json("Error");
    } else {
      con.query("SELECT * FROM customers", function (err, result, fields) {
        if (err) throw err;
        console.log(result);
      });
    }
  });
  
})


app.listen(3000, function() {
    console.log("App started")
});

// module.exports = app
module.exports.handler = serverless(app)
