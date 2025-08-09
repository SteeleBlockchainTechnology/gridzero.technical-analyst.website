import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import axios from 'axios';

// Initialize passport configuration
export function initializePassport() {
  console.log('=== PASSPORT INITIALIZATION START ===');
  console.log('DISCORD_CLIENT_ID:', process.env.DISCORD_CLIENT_ID);
  console.log('DISCORD_CLIENT_SECRET exists:', !!process.env.DISCORD_CLIENT_SECRET);
  console.log('HOST:', process.env.HOST);
  console.log('=== CONFIGURING PASSPORT ===');

  // Serialize user for session storage
  passport.serializeUser((user: any, done) => {
    console.log('Serializing user:', user);
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((obj: any, done) => {
    console.log('Deserializing user:', obj);
    done(null, obj);
  });

  console.log('Creating Discord strategy...');
  passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    callbackURL: process.env.DISCORD_CALLBACK_URL!,
    scope: ['identify', 'guilds'] // Both scopes are required
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('=== DISCORD AUTH CALLBACK START ===');
      console.log('Profile ID:', profile.id);
      console.log('Profile Username:', profile.username);
      console.log('Profile Guilds:', profile.guilds?.length || 'No guilds in profile');
      
      const userId = profile.id;
      
      // Use the bot token to check guild membership and roles
      console.log('Checking guild membership for user:', userId);
      console.log('Guild ID:', process.env.DISCORD_GUILD_ID);
      console.log('Premium Role ID:', process.env.DISCORD_PREMIUM_ROLE_ID);
      
      const memberResponse = await axios.get(
        `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${userId}`,
        {
          headers: { 
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Guild member found successfully');
      console.log('Member roles:', memberResponse.data.roles);
      console.log('Looking for premium role:', process.env.DISCORD_PREMIUM_ROLE_ID);
      
      const memberRoles = memberResponse.data.roles || [];
      const hasPremiumRole = memberRoles.includes(process.env.DISCORD_PREMIUM_ROLE_ID);
      
      console.log('Has premium role:', hasPremiumRole);
      
      if (hasPremiumRole) {
        const verifiedUser = { 
          id: userId, 
          username: profile.username,
          discriminator: profile.discriminator,
          verified: true,
          premiumAccess: true,
          authenticatedAt: new Date().toISOString()
        };
        console.log('✅ User verified successfully:', verifiedUser);
        
        // Save session explicitly after setting user data
        if ((done as any).req && (done as any).req.session) {
          (done as any).req.session.save((err: any) => {
            if (err) console.error('Session Save Error:', err);
          });
        }
        
        return done(null, verifiedUser);
      } else {
        console.log('❌ User does not have premium role');
        console.log('Available roles:', memberRoles);
        console.log('Required role:', process.env.DISCORD_PREMIUM_ROLE_ID);
        // Return false to indicate authentication failure
        return done(null, false, { 
          message: 'Premium Access role is required. Please contact an admin to get the Premium Access role in our Discord server.' 
        });
      }
      
    } catch (error: any) {
      console.error('❌ Discord auth error:', error.message);
      
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        
        if (error.response.status === 404) {
          console.log('User not found in Discord server');
          return done(null, false, { 
            message: 'You must be a member of our Discord server to access premium features. Please join our server first.' 
          });
        } else if (error.response.status === 403) {
          console.log('Bot lacks permissions to check guild membership');
          return done(null, false, { 
            message: 'Server configuration error. Please contact support.' 
          });
        }
      }
      
      // For other errors, pass the error to be handled
      return done(error);
    }
  }));

  console.log('Discord strategy created successfully');
  console.log('=== PASSPORT INITIALIZATION COMPLETE ===');
  return passport;
}