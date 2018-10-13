const fs = require('fs-extra');
const config = require('./config');
const request = require('superagent');
const sleep = require('js-sleep/js-sleep');
const {downloadPath, coverDataPath} = config.zz;

let i = 0; const SLEEP_TIME = 3;
const downloadImages = async (item) => {
    try {
        ++i;
        const url = item.cover;
        let filename = url.substring(url.indexOf("_")-1, url.indexOf("?")-4);
        const path  = `${downloadPath}/${item.isbn}-${filename}.jpg`;
        await request(url).pipe(fs.createWriteStream(path))
            .on('close', () =>{
                console.info(`[${i}] >> ${item.isbn} ${filename}.jpg Download Success!`);
            });
        await sleep(1000 * SLEEP_TIME);  // 延时1秒
        console.info(`延时 ${SLEEP_TIME} 秒 .....`);
    } catch (e) {
        console.error(e);
        return e;
    }
};

const saveAllImages = async () => {
    try {
        const coverInfo = JSON.parse(fs.readFileSync(coverDataPath));
        console.info('coverInfo.size: %d', coverInfo.length);
        for(let item of coverInfo){
            await downloadImages(item);
        }
    } catch (e) {
        console.error(e);
        return e;
    }
};

exports.saveAllImages = saveAllImages;