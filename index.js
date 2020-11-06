const express=require('express');
const app=express();
const path=require('path');
const mongoose=require('mongoose');
const AppError=require('./AppError')
const methodOverride=require('method-override');


const Product=require('./models/product');
const { nextTick } = require('process');

mongoose.connect('mongodb://localhost:27017/farmStand',{
    useNewUrlParser:true,
    useUnifiedTopology:true
})
.then(()=>{
    console.log('MONGO CONNECTION PORT');
})
.catch(err=>{
    console.log('OH NO MONGO CONECTION ERROR');
    console.log(err);
})

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');
app.use(express.urlencoded({extended:true}))
app.use(methodOverride('_method'))

//DEFINING AN ASYNC UTILITY FUNCTION TO AVOID USING TRY-CATCH FOR ERROR HANDLING
function wrapAsync(fn){
    return function(req,res,next){
        fn(req,res,next).catch(e=>next(e));
    }
}


//INDEX ROUTE
app.get('/products',wrapAsync(async (req,res,next)=>{
    const {category}=req.query;
    if(category){
        const products=await Product.find({category})
        res.render('products/index',{products,category});
    }else{
        const products=await Product.find({})
        res.render('products/index',{products,category:'All'});
    }
})
)

//NEW ROUTE
app.get('/products/new',(req,res)=>{
    res.render('products/new');
})

//CREATE ROUTE
app.post('/products',wrapAsync(async (req,res,next)=>{
const newProduct=new Product(req.body);
await newProduct.save();
console.log(newProduct);
res.redirect(`/products/${newProduct._id}`);
})
)


//SHOW ROUTE
app.get('/products/:id',wrapAsync(async (req,res,next)=>{
    const {id}=req.params;
    const product=await Product.findById(id);
    if(!product){
       return next(new AppError('Product Not found',404));
    };
    console.log(product);
    res.render('products/show',{product});
})
);

//EDIT ROUTE
app.get('/products/:id/edit', wrapAsync(async (req,res,next)=>{
   const {id}=req.params;
    const product=await Product.findById(id);
    if(!product){
        return next(new AppError('Product Not found',404));
     };
    res.render('products/edit',{product});
})
)

//UPDATE ROUTE
app.put('/products/:id',wrapAsync(async (req,res,next)=>{
    const {id}=req.params;
   const product=await Product.findByIdAndUpdate(id,req.body,{runValidators:true,new:true});
    res.redirect(`/products/${product._id}`);
})
)

//DELETE ROUTE
app.delete('/products/:id',wrapAsync(async(req,res)=>{
   const {id}=req.params;
    const deletedProduct=await Product.findByIdAndDelete(id);
    res.redirect('/products');
  
})
)

const handleValidationError=err=>{
    console.dir(err);
    return err;
}
//MONGOOSE ERROR HANDLING MIDDLEWARE
app.use((err,req,res,next)=>{
    console.log(err.name);
    if(err.name==='ValidationError')err=handleValidationError(err)
    next(err);
})

//ERRO HANDING MIDDLEWARE
app.use((err,req,res,next)=>{
    const {status=500,message='wrong'}=err;
    res.status(status).send(message);
})

//LISTENING TO PORT
app.listen(3000,()=>{
    console.log('App is Listening on Port 3000');
}
)