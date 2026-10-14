const express = require('express');
const cors = require('cors');
const app = express();
const corsOptions = {
    origin: 'http://localhost:5173', // Reemplaza con la URL de tu frontend
};
app.use(cors(corsOptions));
const Port = 3000;
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.listen(Port, () => {
    console.log(`Backend en http://localhost:${Port}`);
});