const _ = require('lodash');
const _path = require('path');
const fs = require('fs-extra');
const config = require('./config');
const request = require('superagent');
const xlsx = require('node-xlsx').default;
const sleep = require('js-sleep/js-sleep');
const obj  = xlsx.parse('./2w.xlsx');
const {formatDate} = require('./util/dateUtil');

const {PPU, domain, openRoute, addCartPath, bookCartListPath, delRecyclePath, exportPath, coverDataPath} = config.zz;

let isbnList = [];
Object.keys(obj).forEach(function(key) {
    obj[key].data.forEach(function(item){
        isbnList.push(item[0]);
    });
});

let cookie;
const SLEEP_TIME = 5;
const formatCookie = () => {
    cookie = `PPU="${PPU}"`;
    console.info('cookie: ', cookie);
};

const addCart = async (isbn) => {
    try {
        // 旧API
        // const path = `${domain}${openRoute}${addCartPath}?isbn=${isbn}&zzFrom=APP_syfbtc_shoushu&featureId=`;
        // 新API
        const path = `${domain}${openRoute}${addCartPath}?isbn=${isbn}&zzFrom=ppzq&activityId=10006`;
        let result = await request.get(path).set('Cookie', cookie);
        result = JSON.parse(result.text);
        const {respCode, respData, errorMsg} = result;
        if(respCode === 0){
            console.info(`ISBN: ${isbn}, 加入回收车成功`);
            return true;
        } else {
            console.error(`ISBN: ${isbn}, 加入回收车失败`);
            return false;
        }
    } catch (e) {
        console.error(e);
        return e;
    }
};

const getBookInfo = async () => {
    try {
        // 获取该ISBN书籍的信息
        // 旧API
        // const path = `${domain}${openRoute}${bookCartListPath}?activityId=10003`;
        // 新API
        const bookList = [];
        const path = `${domain}${openRoute}${bookCartListPath}?randrom=1537930765237&activityId=10006`;
        let result = await request.get(path).set('Cookie', cookie);
        result = JSON.parse(result.text);
        const {respCode, respData, errorMsg} = result;
        if(respCode === -2 && _.isEmpty(respData)){
            console.warn('警告: 未采集到书籍的任何数据！');
            return bookList;
        }
        console.info(`respCode: ${respCode}, errorMsg: ${errorMsg}`);
        // const books = respData.cartList;  // 旧返回(遗弃)
        const books = respData.rejectedList; // 新返回
        console.info(`books.Size: ${books.length}`);

        for(let book of books){
            bookList.push({
                isbn13          : book.isbn13,
                bookId          : book.bookId,
                title           : book.title,
                authors         : book.authors.join(" "),
                cover           : book.cover,
                estimatePrice   : book.estimatePrice,
                pricingStrategy : book.pricingStrategy,
                redpacket       : book.redpacket,
                discount        : book.discount,
                discountStr     : book.discountStr,
                markupMoney     : book.markupMoney,
                conversionPrice : (book.estimatePrice / 100).toFixed(2)
            });
        }
        return bookList;
    } catch (e) {
        console.error(e);
        return [];
    }
};

const delBookByIsbn = async (isbn) => {
    try {
        const path = `${domain}${openRoute}${delRecyclePath}?isbn=${isbn}`;
        let result = await request.get(path).set('Cookie', cookie);
        result = JSON.parse(result.text);
        const {respCode, respData, errorMsg} = result;
        if(respCode === 0){
            console.info(`ISBN: ${isbn} >> 从回收车删除成功 errorMsg: ${errorMsg}`);
            return true;
        } else {
            console.error(`ISBN: ${isbn} >> 从回收车删除失败 errorMsg: ${errorMsg}`);
            return false;
        }
    } catch (e) {
        console.error(e);
        return e;
    }
};

const getBookPrice = async (isbn) => {
    try {
        // 休眠时间
        await sleep(1000 * SLEEP_TIME);
        // 加入到回收车
        await addCart(isbn);
        // 获取回收车中书籍信息
        const bookList = await getBookInfo();
        // 从回收车中删除
        await delBookByIsbn(isbn);
        return bookList;
    } catch (e) {
        console.error(e);
        return [];
    }
};

const getAllBookPrice = async () => {
    try {
        let count = 0;
        formatCookie();
        let resultList = [];
        console.info('isbnSum: >> ', isbnList.length);
        for(let isbn of isbnList){
            ++count;
            console.info('count: >> ', count);
            const blist = await getBookPrice(isbn);
            resultList = resultList.concat(blist);
            console.info(`休眠 ${SLEEP_TIME} 秒`);
        }
        console.info('resultList.Size: %d', resultList.length);
        return resultList;
    } catch (e) {
        console.error(e);
        return [];
    }
};

const filterCover = async (covers) => {
    try {
        const final = [];
        const map = new Map();
        for(let item of covers){
            let _item = map.get(item.cover);
            if(!_item){
                map.set(item.cover, item);
            }
        }
        for(let [key, value] of map.entries()){
            final.push(value);
        }
        return final;
    } catch (e) {
        return [];
    }
};

const getCover = async () => {
    try {
        const booksPrice = await getAllBookPrice();
        console.info(`${booksPrice.length} 条书籍价格信息`);
        const covers = [];
        for(let item of booksPrice){
            covers.push({isbn: item.isbn13, cover: item.cover});
        }
        const coverInfo = await filterCover(covers);
        await fs.ensureDir(_path.join(coverDataPath, '..'));
        fs.writeFileSync(coverDataPath, JSON.stringify(coverInfo, null, 4));
        return coverInfo;
    } catch (e) {
        console.error(e);
        return [];
    }
};

const exportExcel = async () => {
    try {
        const booksPrice = await getAllBookPrice();
        console.info(`${booksPrice.length} 条书籍价格信息`);
        const zzBooksPriceExcel = [['ISBN','书籍ID','书籍名称','作者','封面', '回收价', '定价策略', 'redpacket', 'discount', 'discountStr', 'markupMoney', 'conversionPrice']];
        for(let item of booksPrice){
            const row = [];
            row.push(item.isbn13);
            row.push(item.bookId);
            row.push(item.title);
            row.push(item.authors);
            row.push(item.cover);
            row.push(item.estimatePrice);
            row.push(item.pricingStrategy);
            row.push(item.redpacket);
            row.push(item.discount);
            row.push(item.discountStr);
            row.push(item.markupMoney);
            row.push(item.conversionPrice);
            zzBooksPriceExcel.push(row);
        }
        const currentTime = formatDate(new Date(), 'YYYY-MM-DD-HH');
        const filename = `${exportPath}/zzBooksPrice-${currentTime}.xlsx`;
        fs.writeFileSync(filename, xlsx.build([
            {name: '转转书籍回收价', data: zzBooksPriceExcel},
        ]));
        console.log(`爬取结束, 成功导出文件: ${filename}`);
    } catch (e) {
        console.error(e);
        return e;
    }
};

exports.getCover = getCover;