import mongoose from "mongoose"

// setting up dB connect link
// const dblink_noname = process.env.MONDODB_URL
// const dblink = dblink_noname.replace("<dbname>" , "smart_agro")
const dblink = "mongodb+srv://dev:dev123@blog-cluster.cilq8t4.mongodb.net/smart_agro?retryWrites=true&w=majority&appName=Blog-Cluster"

const connect_dB = async ()=>{
    try{
        const connectionInstance = await mongoose.connect(dblink);
        console.log("Successfully connected to Database !! \nDB Host :",connectionInstance.connection.host)
    }
    catch(err){
        console.log("Connection to MongodB Failed\n",err)
        process.exit(1)
    }
}

export default connect_dB