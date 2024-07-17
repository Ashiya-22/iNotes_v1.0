// Get Homepage

exports.homepage=async(req,res)=>{
    const locals={
        title:"iNotes-Home",
        description:"Free nodejs notes app.",
    }

    res.render('index',{
        locals,
        layout:'../views/layouts/frontPage'
    });
}

exports.error404=async(req,res)=>{
    const locals={
        title:"404 Page Not Found",
        description:"Free nodejs notes app.",
    }
    res.render('error404',locals);
}