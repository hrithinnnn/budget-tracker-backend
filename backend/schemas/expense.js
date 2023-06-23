const mongoose=require('mongoose')

const ExpenseSchema =mongoose.Schema({
    id:String,
    type: {
        type:String,
        default:"expense"
    },
    title:String,
    amount:Number,
    date:Date,
    user:String
})

module.exports=mongoose.model('Expense',ExpenseSchema)