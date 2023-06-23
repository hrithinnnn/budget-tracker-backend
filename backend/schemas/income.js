const mongoose=require('mongoose')

const incomeSchema=mongoose.Schema({
    id:String,
    type:{
        type:String,
        default:"income"
    },
    title:String,
    amount:Number,
    date:Date,
    user:String
})

module.exports=mongoose.model('income',incomeSchema);