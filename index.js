const express = require('express')
const path = require('path');
const adminApi = require('./routes/admin');
const cors = require('cors')
const app = express();
app.use(cors());

require('dotenv').config();
const port = process.env.PORT || 8000;


const {readdirSync}=require("fs");
 
readdirSync("./routes").map((file)=>app.use('/', require('./routes/'+file)));

 

app.use(express.static(path.join(__dirname, 'public')));

app.use('/admin', adminApi);

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    version: '1.0.0',
    uptime: Math.floor(process.uptime())
  });
});



app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})
