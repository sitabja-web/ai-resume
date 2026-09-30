
require("dotenv").config()
const app = require("./src/app.js")

app.listen(3000, ()=>{
       console.log("server is runnig on port 3000");
       
})

