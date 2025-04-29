import nodemailer from 'nodemailer';
import { google } from 'googleapis';

// These should be set in your environment or a config file
const CLIENT_ID = process.env.GMAIL_CLIENT_ID!;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI! || 'http://localhost:3001/oauth2callback'; // e.g. http://localhost:3001/oauth2callback
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN; // Set after first auth
const USER_EMAIL = process.env.GMAIL_USER! || 'kdhaka94@gmail.com';
const BASE_URL = process.env.BASE_URL || 'http://localhost:8888';

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

export async function sendMail({ to, attachments = [], emailId }: {
  to: string,
  attachments?: any[],
  emailId: number
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

  const trackingPixel = `<img src="${BASE_URL}/track/${emailId}" width="1" height="1" />`;
  
  return transporter.sendMail({
    from: USER_EMAIL,
    to,
    subject: getRandomSubject(),
    html: `
      <div>
        <p>Hi, I saw your post on LinkedIn about the job opening. I'll keep this short.</p>
        
        <p>I am Kuldeep. MockQL is my most impressive project<br/>
        <a href="https://mockql.com/">https://mockql.com/</a><br/>
        In short, unlike other mocking tools, it lets you extend your backend to have mock API with no separate server needed.</p>
        
        <p>With this, I have also worked with several high-profile clients like Sysco, Ulta Beauty, Kisaan etc.</p>
        <ul>
          <li><a href="https://www.ulta.com/">https://www.ulta.com/</a></li>
          <li><a href="https://www.sysco.com/">https://www.sysco.com/</a></li>
          <li><a href="https://kisaan.com.au/">https://kisaan.com.au/</a></li>
        </ul>
        
        <p>Apart from this, you can find more in my resume and GitHub:</p>
        <ul>
          <li>node-shred - <a href="https://github.com/kdhaka94/node-shred">https://github.com/kdhaka94/node-shred</a></li>
          <li>Yolo - <a href="https://github.com/kdhaka94/yolo">https://github.com/kdhaka94/yolo</a></li>
        </ul>
        
        <p>Portfolio: <a href="https://kuldeep-portfolio.web.app/">https://kuldeep-portfolio.web.app/</a></p>
        
        <p>Regards,<br/>Kuldeep</p>
        ${trackingPixel}
      </div>
    `,
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