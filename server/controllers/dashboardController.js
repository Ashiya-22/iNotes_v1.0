const Note=require('../models/Notes');
const mongoose=require('mongoose');
const cryptoJs=require('crypto-js');
const secretKey=process.env.ENCRYPT_SECRET;


function transformToSafePayload(payload) {
  if (typeof payload == 'object') {
    return JSON.stringify(payload);
  }
  if (typeof payload != 'string') {
    return payload.toString();
  }
  return payload;
}

function encrypt(data,key){
  const cipherText=cryptoJs.AES.encrypt(transformToSafePayload(data),key).toString();
  return cipherText;
}

function decryption(cipherText,key){
  try {
      const bytes=cryptoJs.AES.decrypt(cipherText,key);
      if(bytes.sigBytes>0){
          const decryptedData=bytes.toString(cryptoJs.enc.Utf8);
          return decryptedData;
      }     
  } catch (error) {
      console.log(error);
  }
}


// Get Dashboard


exports.dashboard = async(req,res)=>{

    const locals = {
        title:"iNotes-Dashboard",
        description:"Free nodejs notes app.",
    }

    let perPage=6;
    let page=req.query.page || 1;
    
    try {
    const notes = await Note.aggregate([
      { $sort: { updatedAt: -1 } },
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $project: {
          title: { $substr: ["$title", 0, 30] },
          body: { $substr: ["$body", 0, 500] },
        },
      }
      ])
    .skip(perPage * page - perPage)
    .limit(perPage)
    .exec(); 

    const count = await Note.countDocuments();

    if (notes.length > 0) { for(let i=0; i < notes.length; i++) {
      notes[i].body=decryption(notes[i].body,secretKey);}
    }

    res.render('dashboard/index', {
      userProfile:req.user.profileImage,
      displayName:req.user.displayName,
      locals,
      notes,
      layout: "../views/layouts/dashboard",
      current: page,
      pages: Math.ceil(count / perPage)
    });

  } catch (error) {
    console.log(error);
  }
};

// View note
exports.dashboardViewNote = async (req, res) => {
  const locals = {
    title:"iNotes-View Notes",
    description:"Free nodejs notes app.",
  }

  const note = await Note.findById({ _id: req.params.id })
    .where({ user: req.user.id })
    .lean();

  note.body=decryption(note.body,secretKey);

  if (note) {
    res.render("dashboard/view-note", {
      noteID: req.params.id,
      userProfile:req.user.profileImage,
      note,
      locals,
      layout: "../views/layouts/dashboard",
    });
  } else {
    res.send("Something went wrong :( ");
  }
};

// Update note

exports.dashboardUpdateNote=async(req,res)=>{
  const noteUpdateBody=encrypt(req.body.body,secretKey);

  try {
    await Note.findOneAndUpdate(
      { _id: req.params.id },
      { title: req.body.title, body: noteUpdateBody, updatedAt: Date.now() }
    ).where({ user: req.user.id });
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
};

// Delete note
exports.dashboardDeleteNote = async (req, res) => {
  try {
    await Note.deleteOne({ _id: req.params.id }).where({ user: req.user.id });
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
};

// Add note(GET)
exports.dashboardAddNote = async (req, res) => {
  const locals = {
    title:"iNotes-Add Notes",
    description:"Free nodejs notes app.",
  }
  res.render("dashboard/add", {
    locals,
    userProfile:req.user.profileImage,
    layout: "../views/layouts/dashboard",
  });
};

 // Add note(POST)
exports.dashboardAddNoteSubmit = async (req, res) => {
  const noteAddBody=encrypt(req.body.body,secretKey);

  try {
    // req.body.user = req.user.id;
    await Note.create({
      user: req.user.id,
      title: req.body.title,
      body: noteAddBody
    });
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error);
  }
};

// Search notes(GET)
exports.dashboardSearch = async (req, res) => {
  const locals = {
    title:"iNotes-Search Notes",
    description:"Free nodejs notes app.",
  }

  try {
    res.render("dashboard/search", {
      searchResults: "",
      userProfile:req.user.profileImage,
      locals,
      layout: "../views/layouts/dashboard",
    });
  } catch (error) {}
};

// Search note(POST)
exports.dashboardSearchSubmit = async (req, res) => {
  const locals = {
    title:"iNotes-Search Notes",
    description:"Free nodejs notes app.",
  }
  
  try {
    let searchTerm = req.body.searchTerm;
    const searchNoSpecialChars = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");

    const searchResults = await Note.find({
      $or: [
        { title: { $regex: new RegExp(searchNoSpecialChars, "i") } },
      ],
    }).where({ user: req.user.id });

    res.render("dashboard/search", {
      searchResults,
      userProfile:req.user.profileImage,
      locals,
      layout: "../views/layouts/dashboard",
    });
  } catch (error) {
    console.log(error);
  }
};