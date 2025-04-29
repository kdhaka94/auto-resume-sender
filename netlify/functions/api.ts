import { Handler } from '@netlify/functions';
import serverless from 'serverless-http';
import { app } from '../..';

const serverlessHandler = serverless(app);
const handler: Handler = async (event, context) => {
  const result = await serverlessHandler(event, context) as { statusCode?: number };
  return {
    ...result,
    statusCode: result.statusCode || 200
  };
};

export { handler };
