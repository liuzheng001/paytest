import format from './utils';

// const URL = 'https://demo.antcloud-miniprogram.com';
const URL = 'http://localhost:9998/alipay-sdk-PHP-4/aop';
Page({
  data: {
    paymentHistory: null, //支付历史记录
    isPaying: false, //支付状态
    uid: null, //用户ID
    isLogin: false //登录状态
  },
  /**
   *  @name onClickHandler
   *  @description 查看/支付按钮操作
   */
  async onClickHandler() {
    this.setData({
      isPaying: true
    });
    if (!this.data.isLogin) {
      //未登录状态
      try {
        const auth = await this.getAuthCode('auth_user');
        const user = await this.getUserByAuthCode(auth.authCode);
        // const history = await this.getPaymentHistoryByUID(user.userId);
        this.setData({
          isPaying: false,
          // paymentHistory: history,
          isLogin: true,
          uid: user.userId
        });
      } catch (error) {
        this.setData({
          isPaying: false
        });
        this.showToast(error.message, 'exception');
      }
    } else {
      // 已登录
      try {
        const auth = await this.getAuthCode('auth_user');
        const trade = await this.getTradeNo(auth.authCode, this.data.uid);
        const payStatus = await this.cashPaymentTrade(trade.tradeNo);
        this.showToast(payStatus.message);
        const updatePayment = await this.updatePaymentListByTradeNo(trade.tradeNo);
        this.setData({
          paymentHistory: updatePayment,
          isPaying: false
        });
      } catch (error) {
        this.setData({
          isPaying: false
        });
        this.showToast(error.message, 'exception');
      }
    }
  },

  /**
   * @name onRefundPayHandler
   * @description 发起退款
   * @param {*} event
   */
  async onRefundPayHandler(event) {
    const { key } = event.target.dataset;
    const refundItem = await this.findActiveTradeByNo(key);
    try {
      if (refundItem !== null) {
        const refundOrder = await this.refundPaymentByTradeNo(
          refundItem.tradeNo,
          refundItem.totalAmount
        );
        const updatePayment = await this.updatePaymentListByTradeNo(refundOrder.tradeNo);
        this.showToast('退款成功');
        this.setData({
          paymentHistory: updatePayment
        });
      } else {
        this.showToast('未知支付订单', 'exception');
      }
    } catch (error) {
      this.showToast(error.message, 'exception');
    }
  },
  /**
   * @name onRepeatPayHandler
   * @description 列表重新付款
   * @param {*} event
   */
  async onRepeatPayHandler(event) {
    const { key } = event.target.dataset;
    const repeatItem = await this.findActiveTradeByNo(key);
    try {
      if (repeatItem !== null) {
        const payStatus = await this.cashPaymentTrade(repeatItem.tradeNo);
        this.showToast(payStatus.message);
        const updatePayment = await this.updatePaymentListByTradeNo(repeatItem.tradeNo);
        this.setData({
          paymentHistory: updatePayment
        });
      } else {
        this.showToast('未知支付订单', 'exception');
      }
    } catch (error) {
      this.showToast(error.message, 'exception');
    }
  },
  /**
   * @name findActiveTradeByNo
   * @description 查找当前操作项
   * @param {*} tradeNo
   * @returns
   */
  async findActiveTradeByNo(tradeNo) {
    const findItem = this.data.paymentHistory.find((item) => {
      return item.key === tradeNo;
    });
    if (findItem !== undefined) {
      findItem.actionStatus = true;
      this.setData({
        paymentHistory: this.data.paymentHistory
      });
      return findItem;
    } else {
      return null;
    }
  },

  /**
   * @name updatePaymentListByTradeNo
   * @description 根据tradeNo更新列表数据
   * @param {*} tradeNo
   * @returns
   */
  async updatePaymentListByTradeNo(tradeNo) {
    let isExistOrder = false;
    const order = await this.queryPaymentByTradeNo(tradeNo);
    const formatHistory = this.data.paymentHistory.map((item) => {
      if (item.tradeNo === order.tradeNo) {
        isExistOrder = true;
        item.key = order.tradeNo;
        item.tradeNo = order.tradeNo;
        item.actionStatus = false;
        item.totalAmount = order.totalAmount;
        item.tradeStatus = order.tradeStatus;
        item.viewTime = format(order.sendPayDate, 'yyyy-MM-dd hh:mm:ss');
      }
      return item;
    });
    if (!isExistOrder) {
      const addOrder = {};
      addOrder.key = order.tradeNo;
      addOrder.actionStatus = false;
      addOrder.tradeNo = order.tradeNo;
      addOrder.totalAmount = order.totalAmount;
      addOrder.tradeStatus = order.tradeStatus;
      addOrder.viewTime = format(order.sendPayDate, 'yyyy-MM-dd hh:mm:ss');
      formatHistory.unshift(addOrder);
    }
    return formatHistory;
  },

  /***************************/
  /******* 封装服务端 API ******/
  /***************************/
  /**
   * @name getUserByAuthCode
   * @description 获取用户信息
   * @param {*} authCode
   * @returns
   */
  getUserByAuthCode(authCode) {
    return new Promise((resolve, reject) => {
      my.request({
        url: `${URL}/test/alipayUserInfo.php`,
        data: {
          authCode: authCode
        },
        success: (result) => {
          if (!result.data.success) {
            reject({
              ...result.data,
              message: '获取用户信息失败'
            });
          }
          resolve(result.data);
        },
        fail: (err) => {
          reject({
            ...err,
            message: '获取用户信息异常'
          });
        }
      });
    });
  },
  /**
   * @name getPaymentHistoryByUID
   * @description 获取登录用户的支付历史记录
   * @param {*} uid
   * @returns {Array/object}
   */
  getPaymentHistoryByUID(uid) {
    return new Promise((resolve, reject) => {
      my.request({
        url: `${URL}/alipay/pay/userPay`,
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        data: {
          userId: uid
        },
        success: (result) => {
          if (!result.data.success) {
            reject({
              ...result.data,
              message: '获取支付历史失败'
            });
          } else {
            const formatHistory = result.data.alipayTradeQueryList.map((item) => {
              const order = {};
              order.key = item.tradeNo;
              order.tradeNo = item.tradeNo;
              order.actionStatus = false;
              order.totalAmount = item.totalAmount;
              order.tradeStatus = item.tradeStatus;
              order.viewTime = format(item.sendPayDate, 'yyyy-MM-dd hh:mm:ss');
              return order;
            });
            resolve(formatHistory);
          }
        },
        fail: (err) => {
          reject({
            ...err,
            message: '获取支付历史异常'
          });
        }
      });
    });
  },
  /**
   * @name getTradeNo
   * @description 创建支付交易订单
   * @param {*} authCode
   * @param {*} uid
   * @returns {object}
   */
  getTradeNo(authCode, uid) {
    return new Promise((resolve, reject) => {
      my.request({
        url: `${URL}/alipay/pay/alipayTradeCreate`,
        data: {
          total_amount: '0.01',
          out_trade_no: `${new Date().getTime()}_demo_pay`,
          scene: 'bar_code',
          auth_code: authCode,
          subject: '小程序支付演示DEMO',
          buyer_id: uid
        },
        success: (result) => {
          if (!result.data.success) {
            reject({
              ...result.data,
              message: '创建支付订单失败'
            });
          } else {
            resolve(result.data);
          }
        },
        fail: (err) => {
          reject({
            ...err,
            message: '创建支付订单异常'
          });
        }
      });
    });
  },
  /**
   * @name queryPaymentByTradeNo
   * @description 查询单笔订单
   * @param {*} tradeNo
   * @returns
   */
  queryPaymentByTradeNo(tradeNo) {
    return new Promise((resolve, reject) => {
      my.request({
        url: `${URL}/alipay/pay/alipayTradeQuery`,
        data: {
          trade_no: tradeNo
        },
        success: (result) => {
          if (!result.data.success) {
            reject({
              message: '支付查询失败',
              ...result.data
            });
          } else {
            resolve(result.data);
          }
        },
        fail: (err) => {
          reject({
            message: '支付查询异常',
            ...err
          });
        }
      });
    });
  },
  /**
   * @name refundPaymentByTradeNo
   * @description 退款流程
   * @param {*} tradeNo
   * @param {*} refundAmount
   */
  refundPaymentByTradeNo(tradeNo, refundAmount) {
    return new Promise((resolve, reject) => {
      my.request({
        url: `${URL}/alipay/pay/alipayTradeRefund`,
        data: {
          trade_no: tradeNo,
          refund_amount: refundAmount
        },
        success: (result) => {
          if (!result.data.success) {
            reject({
              message: '退款失败',
              ...result.data
            });
          } else {
            resolve(result.data);
          }
        },
        fail: (err) => {
          reject({
            message: '退款异常',
            ...err
          });
        }
      });
    });
  },

  /***************************/
  /******* 封装小程序 API ******/
  /***************************/
  /**
   * @name getAuthCode
   * @description 获取用户授权
   * @param {string} [scopeCode='auth_user']
   * @returns {object}
   */
  getAuthCode(scopeCode = 'auth_user') {
    return new Promise((resolve, reject) => {
      my.getAuthCode({
        scopes: scopeCode,
        success: (auth) => {
          resolve(auth);
        },
        fail: (err) => {
          reject({ ...err, message: '获取用户授权失败' });
        }
      });
    });
  },
  /**
   * @name cashPaymentTrade
   * @description 发起支付
   * @param {*} tradeNo
   * @returns
   */
  cashPaymentTrade(tradeNo) {
    return new Promise((resolve, reject) => {
      my.tradePay({
        tradeNO: tradeNo,
        success: (result) => {
          if (result.resultCode != 9000) {
            resolve({
              status: false,
              message: result.memo,
              ...result
            });
          } else {
            resolve({
              status: true,
              message: '支付成功',
              ...result
            });
          }
        },
        fail: (err) => {
          reject({
            status: false,
            message: '支付异常',
            ...err
          });
        }
      });
    });
  },
  /**
   * @name showToast
   * @description 通用提示信息
   * @param {*} message
   * @param {string} [type='none']
   */
  showToast(message, type = 'none') {
    my.showToast({
      type,
      content: message,
      duration: 3000
    });
  }, // .js
    onGetAuthorize(res) {
        my.getOpenUserInfo({
            fail: (res) => {
            },
            success: (res) => {
                let userInfo = JSON.parse(res.response).response // 以下方的报文格式解析两层 response
                my.alert({content:JSON.stringify(userInfo)})
            }
        });
    },
});
