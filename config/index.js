const path = require('path');

const config = {
    zz: {
        PPU: 'TT=47c6fb10300b86636675d57b3106ccedadf5ea1c&UID=58317480120192256&SF=ZHUANZHUAN&SCT=1531974203093&V=1&ET=1534562603093',
        domain: 'https://zhuan.58.com',
        openRoute: '/zzopen/book',
        addCartPath: '/getBook',
        bookCartListPath: '/getBookCartList?activityId=10003',
        delRecyclePath: '/delRecycleBookCart',
        bookDataPath : path.join(__dirname, '..', 'data/zz/booksPrice.json'),
        exportPath: path.join(__dirname, '..', 'download/excel'),
    },
    category: {
        phone: 1,
        tablet: 2
    },
    /**
     * 返回或设置当前环镜
     */
    env: function () {
        global.$config = this;

        return global.$config;
    }
};

module.exports = config.env();