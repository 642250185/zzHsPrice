const _ = require('lodash');
const _path = require('path');
const fs = require('fs-extra');
const request = require('superagent');
const config = require('./config');
const xlsx = require('node-xlsx').default;
const sleep = require('js-sleep/js-sleep');
const obj  = xlsx.parse('./zz.xlsx');
const {formatDate} = require('./util/dateUtil');

const {PPU, domain, openRoute, addCartPath, bookCartListPath, delRecyclePath, exportPath} = config.zz;

let isbnList = [];
Object.keys(obj).forEach(function(key) {
    obj[key].data.forEach(function(item){
        isbnList.push(item[0]);
    });
});

let cookie;
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
            console.info(`ISBN: ${isbn} >> 加入回收车成功 respData: %j`, respData);
            return true;
        } else {
            console.error(`ISBN: ${isbn} >> 加入回收车失败 errorMsg: %j`, errorMsg);
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
        console.info(`respCode: ${respCode}, errorMsg: ${errorMsg} respData: %j`, respData);
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
            console.info(`ISBN: ${isbn} >> 从回收车删除成功 ${errorMsg}`);
            return true;
        } else {
            console.error(`ISBN: ${isbn} >> 从回收车删除失败 ${errorMsg}`);
            return false;
        }
    } catch (e) {
        console.error(e);
        return e;
    }
};

const getBookPrice = async (isbn) => {
    try {
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
        for(let isbn of isbnList){
            ++count;
            await sleep(1000 * 2);
            console.info('count: >> ', count);
            const blist = await getBookPrice(isbn);
            resultList = resultList.concat(blist);
        }
        console.info('resultList.Size: %d', resultList.length);
        return resultList;
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

exportExcel();