const {getCover} = require('./zzHsPrice');
const {saveAllImages} = require('./saveImages');

const start = async () => {
    console.log('start ......');
    console.log('start crawl book Cover');
    await getCover();
    console.log('end crawled book Cover');

    console.log('start save book Cover');
    await saveAllImages();
    console.log('end save book Cover');
    console.log('end ......');
};


start();