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
    scope: ['identify']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const userId = profile.id;
      const memberResponse = await axios.get(
        `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${userId}`,
        {
          headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
        }
      );
      const roles = memberResponse.data.roles;
      if (roles.includes(process.env.DISCORD_PREMIUM_ROLE_ID)) {
        return done(null, { verified: true, userId });
      } else {
        return done(null, false, { message: 'Premium Access role is required for verification.' });
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return done(null, false, { message: 'User not found in the Discord server.' });
      }
      return done(error);
    }
  }));

  return passport;
}