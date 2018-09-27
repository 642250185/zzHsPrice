const path = require('path');

const config = {
    zz: {
        PPU: 'TT=fac50e2017c1c8de8e2ee8a5d6450baf878ea60b&UID=46028783232276&SF=ZHUANZHUAN&SCT=1537935861736&V=1&ET=1540524261736',
        domain: 'https://zhuan.58.com',
        openRoute: '/zzopen/book',
        addCartPath: '/getBook',
        bookCartListPath: '/getBookCartList',
        delRecyclePath: '/delRecycleBookCart',
        bookDataPath : path.join(__dirname, '..', 'data/booksPrice.json'),
        coverDataPath : path.join(__dirname, '..', 'data/cover.json'),
        exportPath: path.join(__dirname, '..', 'download'),
        downloadPath: path.join(__dirname, '..','download/images'),
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