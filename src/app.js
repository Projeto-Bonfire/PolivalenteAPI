import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cron from 'node-cron';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import chalk from 'chalk';
import log from 'gulog';
import cors from 'cors';

import apiLimiter from './middlewares/apiLimiter.js';
import connectDB from './database/connect.js';
import { router } from './routes/index.js';
import Crons from './middlewares/crons.js';
import config from './config/default.js';
import Errors from './util/error.js';

export const { sendError } = new Errors();
export const app = express();
connectDB();
const CronsService = new Crons();

const handleFormDataAndJSON = (req, res, next) => {
  const contentType = req.headers['content-type'];
  if (contentType && contentType.startsWith('multipart/form-data')) {
    const upload = multer();
    upload.none()(req, res, next);
  } else if (contentType && contentType.startsWith('application/json')) {
    express.json()(req, res, next);
  } else {
    next();
  }
};

if (config.logRequestInformations) app.use(morgan('dev'));

app.use(helmet());
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: '*'
}));

app.use(express.json());
app.use(handleFormDataAndJSON);

app.use('/v3', [apiLimiter], router);

app.use((err, req, res, next) => {
  log.error(`An error ocurred at route: general route`);
  console.log(err);
  return sendError(res, 'internal_error', {
    logger: false
  });
});

app.listen(config.port, () => {
  console.log(chalk.green(`Server is running on port ${config.port}`));
});

