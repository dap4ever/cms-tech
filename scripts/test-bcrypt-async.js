const bcrypt = require('bcryptjs');

async function testBcrypt() {
    const hash = await bcrypt.hash('admin', 10);
    console.log('Hash generated');
    const match = await bcrypt.compare('admin', hash);
    console.log('Match with await:', match);
}

testBcrypt();
