const path = require('path');

const config = {
    zz: {
        PPU: 'TT=e455cbe40786afc0913de961956d0530ee5a8341&UID=46028783232276&SF=ZHUANZHUAN&SCT=1535112154426&V=1&ET=1537700554426',
        domain: 'https://zhuan.58.com',
        openRoute: '/zzopen/book',
        addCartPath: '/getBook',
        bookCartListPath: '/getBookCartList?activityId=10003',
        delRecyclePath: '/delRecycleBookCart',
        bookDataPath : path.join(__dirname, '..', 'data/booksPrice.json'),
        exportPath: path.join(__dirname, '..', 'download'),
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