const router=require('express').Router();
const multer=require('multer');//for storing files
const path=require('path');
const File=require('../models/file');
const { v4: uuidv4 } = require('uuid');

let storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),//storing image in uploads
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;/*unique file name*/
        cb(null, uniqueName)
    } ,
});

let upload = multer({ storage, limits:{ fileSize: 1000000 * 100 }, }).single('myfile');

router.post('/',(req,res)=>{
   
   //Store file
   upload(req,res,async (err) => {
    //validate request
   if(!req.file)/* file is the name given through front end */
   {
       return res.json({error:'All fields are required.'});
   }
    if(err){
        return res.status(500).send({error:err.message});
    }
    
    //Store into DB
    const file=new File({
        filename:req.file.filename,
        uuid:uuidv4(),
        path:req.file.path,
        size:req.file.size
    });
     const response=await file.save();  
     return res.json({file:`${process.env.APP_BASE_URL}/files/${response.uuid}`});
   });

   

   //Response file link
});


router.post('/send',async (req,res) => {
    const {uuid,emailTo,emailFrom}=req.body;
    //check if all parameter are present
    if(!uuid || !emailTo || !emailFrom){
        return res.status(422).send({error:'All fields are required.'});
    }
    //Get data from database
    
 
     const file = await File.findOne({ uuid: uuid });
    
     if(file.sender) {
       return res.status(422).send({ error: 'Email already sent once.'});
     }
     file.sender = emailFrom;
     file.receiver = emailTo;
     const response = await file.save();
     // send mail
     const sendMail = require('../services/mailService');
     
     sendMail({
       from: emailFrom,
       to: emailTo,
       subject: 'inShare file sharing',
       text: `${emailFrom} shared a file with you.`,
       html: require('../services/emailTemplate')({
                 emailFrom:emailFrom, 
                 downloadLink: `${process.env.APP_BASE_URL}/files/${file.uuid}` ,
                 size: parseInt(file.size/1000) + ' KB',
                 expires: '24 hours'
             })
            });
            return res.send({success:'Email already sent.'})
             
//      }).then(() => {
//        return res.json({success: true});
//      }).catch(err => {
//        return res.status(500).json({error: 'Error in email sending.'});
//      });
//  } catch(err) {
//    return res.status(500).send({ error: 'Something went wrong.'});
//  }
 
 
 });
 

module.exports=router;