import nodemailer from 'nodemailer';
import { google } from 'googleapis';

// These should be set in your environment or a config file
const CLIENT_ID = process.env.GMAIL_CLIENT_ID!;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI! || 'http://localhost:3001/oauth2callback'; // e.g. http://localhost:3001/oauth2callback
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN; // Set after first auth
const USER_EMAIL = process.env.GMAIL_USER! || 'kdhaka94@gmail.com';

const SUBJECTS = [
    "Your Next Star Engineer's Resume—Open to See Why",
    "The Resume That Ulta & Sysco Wouldn't Pass Up",
    "Your Hiring Jackpot: My Resume Is Attached",
    "The Resume Your CTO Can't Ignore—See Attached",
    "The Only Resume You Need to Read Today"
]

const getRandomSubject = () => {
    return SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
}

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
if (REFRESH_TOKEN) {
  oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
}

export function getAuthUrl() {
  const SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://mail.google.com/'
  ];
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export async function setTokensFromCode(code: string) {
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  return tokens;
}

export async function sendMail({ to, attachments = [] }: {
  to: string,
  attachments?: any[],
}) {
  // Get a fresh access token
  const { token } = await oAuth2Client.getAccessToken();
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: USER_EMAIL,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: oAuth2Client.credentials.refresh_token,
      accessToken: token as string,
    },
  });
  return transporter.sendMail({
    from: USER_EMAIL,
    to,
    subject: getRandomSubject(),
    text: `Hi, I saw your post on linkedin, about job opening, I'll keep this short.

I am Kuldeep. MockQL is my most impressive project
https://mockql.com/ 
In short, unlike other mocking tool it lets you extend your backend to have mock api no separate server need. 

With this I have also worked with several high profile clients like Sysco, Ulta Beauty, Kisaan etc. 
https://www.ulta.com/
https://www.sysco.com/
https://kisaan.com.au/

Apart from this you can find a bunch in my resume and github like
node-shred - https://github.com/kdhaka94/node-shred
Yolo - https://github.com/kdhaka94/yolo


Portfolio : https://kuldeep-portfolio.web.app/

Regards,
Kuldeep`,
    attachments,
  });
}

/*
Setup:
1. Go to https://console.cloud.google.com/
2. Create a project, enable Gmail API, create OAuth2 credentials (Web app)
3. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI, GMAIL_USER in your environment
4. Visit /auth/gmail in your API to get the auth URL, complete the flow, and set GMAIL_REFRESH_TOKEN
*/ 