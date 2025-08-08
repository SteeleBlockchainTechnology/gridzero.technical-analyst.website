import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import axios from 'axios';

// Initialize passport configuration
export function initializePassport() {
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj: any, done) => done(null, obj));

  passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    callbackURL: process.env.DISCORD_CALLBACK_URL!,
    scope: ['identify', 'guilds'] // ADD 'guilds' scope to get guild info
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('=== DISCORD AUTH CALLBACK ===');
      console.log('Profile ID:', profile.id);
      console.log('Profile Username:', profile.username);
      
      const userId = profile.id;
      
      // Check if user is in the guild and has premium role
      const memberResponse = await axios.get(
        `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${userId}`,
        {
          headers: { 
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` 
          }
        }
      );
      
      console.log('Guild member data:', memberResponse.data);
      console.log('User roles:', memberResponse.data.roles);
      console.log('Looking for role ID:', process.env.DISCORD_PREMIUM_ROLE_ID);
      
      const roles = memberResponse.data.roles;
      const hasRolePremium = roles.includes(process.env.DISCORD_PREMIUM_ROLE_ID);
      
      console.log('Has premium role:', hasRolePremium);
      
      if (hasRolePremium) {
        const user = { 
          id: userId, 
          username: profile.username, 
          verified: true 
        };
        console.log('User verified successfully:', user);
        return done(null, user);
      } else {
        console.log('User does not have premium role');
        return done(null, false, { message: 'Premium Access role is required for verification.' });
      }
    } catch (error: any) {
      console.error('Discord auth error:', error.response?.data || error.message);
      if (error.response && error.response.status === 404) {
        return done(null, false, { message: 'User not found in the Discord server.' });
      }
      return done(error);
    }
  }));

  return passport;
}