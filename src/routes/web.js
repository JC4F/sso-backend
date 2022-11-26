import express from "express";
import homeController from '../controller/homeController';
import apiController from '../controller/apiController';
import loginController from "../controller/loginController";
import passController from "../controller/passportController";
import passport from 'passport';
import checkUser from '../middleware/checkUser';

const fs = require('fs');
const router = express.Router();

/**
 * 
 * @param {*} app : express app
 */

const initWebRoutes = (app) => {
    //path, handler
    router.get("/", checkUser.isLogin, homeController.handleHelloWord);
    router.get('/err', (req, res, next) => {
        fs.readFile('/file-does-not-exist', (err, data) => {
          if (err) {
            next(err) // Pass errors to Express.
          } else {
            res.send(data)
          }
        })
      }, 
      (err, req, res, next) =>{
        res.status(500)
        res.render('error', { error: err })
      })
    router.get("/user", homeController.handleUserPage);
    router.post("/users/create-user", homeController.handleCreateNewUser);
    router.post("/delete-user/:id", homeController.handleDelteUser)
    router.get("/update-user/:id", homeController.getUpdateUserPage);
    router.post("/user/update-user", homeController.handleUpdateUser);

    //rest api
    //GET - R, POST- C, PUT - U, DELETE - D
    router.get("/api/test-api", apiController.testApi);
    router.get("/login", checkUser.isLogin, loginController.getLoginPage);
    router.post('/login', function(req, res, next){
      passport.authenticate('local', function(error, user, info){
        if(error){
          return res.status(500).json(error);
        }
        if(!user){
          return res.status(401).json(info.message);
        }
        // console.log(">>>user: ", user, ">>>info: ", info);
        req.login(user, function(err){
          if(err) return next(err);
          // console.log(">>>user in login: ", user)
          return res.status(200).json({...user, redirectURL: req.body.serviceURL});
        });
      })(req, res, next);
    });
    router.post('/logout', passController.handleLogout);
    router.post('/verify-token', loginController.verifySSOToken);

    router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
    router.get('/google/redirect', 
      passport.authenticate('google', { failureRedirect: '/login' }),
      function(req, res) {
        // Successful authentication, redirect home.
        return res.render('social.ejs', {ssoToken: req.user.code})
    });

    router.get('/auth/facebook', passport.authorize('facebook', { scope : ['email'] }));

    router.get('/facebook/redirect',
      passport.authenticate('facebook', { failureRedirect: '/login' }),
      function(req, res) {
        // Successful authentication, redirect home.
        return res.render('social.ejs', {ssoToken: req.user.code})
    });

    router.get('/forgot-password', loginController.getResetPasswordPage)
    router.post('/send-code', loginController.sendCode)

    return app.use("/", router);
}

export default initWebRoutes;