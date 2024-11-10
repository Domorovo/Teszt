// passport-config.js
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./models/User");

function initialize(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        const existingUser = await User.findOne({ googleId: profile.id });
        if (existingUser) return done(null, existingUser);

        const newUser = new User({
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value,
        });
        await newUser.save();
        done(null, newUser);
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser((id, done) => User.findById(id, (err, user) => done(err, user)));
}

module.exports = initialize;
