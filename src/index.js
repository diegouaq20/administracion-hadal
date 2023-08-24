const app = require('./app');

const port = app.get('port') || 4000;

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
