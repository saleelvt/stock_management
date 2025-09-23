const express = require('express');
const db = require('./config/db');
const productRouter = require('./routes/productRoute');
const saleRouter = require('./routes/saleRoute');
const returnRouter = require('./routes/returnRoute');
const healthRouter = require('./routes/healthRoute');

const cors = require('cors');

require('dotenv').config();

const app = express();
app.use(cors({
  origin: '*', // Allow only your frontend              
}));


app.use(express.json());
app.use(express.urlencoded({extended : true}));

app.use('/', healthRouter); // exposes /healthz and /readyz
app.use('/api/products', productRouter);
app.use('/api/sales', saleRouter);
app.use('/api/returns', returnRouter);

// Not found and error handlers (JSON responses)
const { notFoundMiddleware, errorMiddleware } = require('./utils/http');
app.use(notFoundMiddleware);
app.use(errorMiddleware);

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT || 5000;  
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));


