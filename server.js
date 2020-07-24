const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose');
mongoose.connect(process.env.MLAB_URI,{useNewUrlParser:true,useUnifiedTopology:true});

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'));

const Schema = mongoose.Schema;

const userSchema = Schema({
   username:{
     type:String,
     required:true
   }
});

const exerciseSchema = Schema({
   username:{type:String},
   description:{type:String,required:true},
   duration:{type:Number,required:true},
   date:{type:Date}
});

const userModel = mongoose.model('users',userSchema);
const exerciseModel = mongoose.model('exercise',exerciseSchema);

//======================= news user =========================//
app.post('/api/exercise/new-user',(req,res)=>{
   const users = new userModel({
     username:req.body.username
   });
  users.save((err,data)=>{
     if(err)return console.log(err);
    return res.send({"username":data.username,"_id":data._id});
  });
});
//============================================================//

//=================== show all users ========================//
app.get('/api/exercise/users',(req,res)=>{
   userModel.find((err,data)=>{
      if(err)return console.log(err);
      res.send(data);
   });
});

//===========================================================//

//==================== add exercise ========================//
app.post('/api/exercise/add',(req,res)=>{
  
  var datee = null;
  
  if(!req.body.date){
    datee = new Date().toDateString();
  }else{
   datee = new Date(req.body.date).toDateString(); 
  }
  if(req.body.userId&&req.body.description&&req.body.duration){
    var dur = parseInt(req.body.duration);
    console.log(dur);
    
userModel.find({_id:req.body.userId},(err,data)=>{
    if(err)console.log(err)
   const exercise = new exerciseModel({
       username:data[0].username,
       description:req.body.description,
       duration:parseInt(req.body.duration),
       date:datee
   });
  
  exercise.save((err,exerciseData)=>{
     if(err) console.log(err)
    console.log(exerciseData)
      res.send({
        "username":exerciseData.username,
        "description":exerciseData.description,
        "duration":exerciseData.duration,
        "_id":req.body.userId,
        "date":datee
      });
  });
});
    
  }else{
    res.send({error:'enter valid values in userId,description,duration fields'});
  }
});

//===========================================================================//

//========================== exercise log ==================================//
app.get('/api/exercise/log',(req,res)=>{
    userModel.find({_id:req.query.userId},(err,data)=>{
       if(err)console.log(err);
      console.log(data);
       exerciseModel.find({username:data[0].username},(err,exerData)=>{
          if(err)console.log(err);
          if(req.query.from && req.query.to){
            exerData = exerData.filter((d)=> (Date.parse(d.date) >= Date.parse(req.query.from)) && (Date.parse(d.date) <= Date.parse(req.query.to)));
          }
         if(req.query.limit){
           exerData = exerData.slice(0,req.query.limit)  
           // filter((d,i)=> i < req.query.limit);
         }
          res.send({
            "username":exerData.username,
            "_id":req.query.userId,
            "log":exerData,
            "count":exerData.length
          });
       });
    });
});
//=========================================================================//

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});