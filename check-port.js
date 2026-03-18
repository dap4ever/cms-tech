const net = require('net');
const client = new net.Socket();
client.connect(5432, 'localhost', function() {
	console.log('Connected to PostgreSQL port 5432!');
	client.destroy();
});
client.on('error', function(err) {
	console.error('Connection failed:', err.message);
});
