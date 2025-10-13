const fs = require('fs');
const http = require('http');
const port = 3000;

const haram = {
	vak4: '4vak',
	vak5: '5vak'
}

const requestHandler = (request, response) =>{
	console.log(`URL: ${request.url}`);
	switch (request.url)
	{
	case '/haram':
		response.end(JSON.stringify(haram));
		break;
	case '/index.css':
		fs.readFile('C:/\Users/\kiril/\TRPO_Git/\index.css', (err, data) => {
        if (err) {
          response.end('Error: ', err);
        }else{
        	response.end(data);
        }});
		break;
	case '/game.js':
		fs.readFile('C:/\Users/\kiril/\TRPO_Git/\game.js', (err, data) => {
        if (err) {
          response.end('Error: ', err);
        }else{
        	response.end(data);
        }});
		break;
	default:
		fs.readFile('C:/\Users/\kiril/\TRPO_Git/\index.html', (err, data) => {
        if (err) {
          response.end('Error: ', err);
        }else{
        	response.end(data);
        }});
		break;
	}
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
	if(err){
		return console.log('Error: ', err);
	}
	console.log(`server is listening on ${port}`);
});