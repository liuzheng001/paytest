/**
 * 时间格式化
 * @param {date|number} date 需要格式化的日期（数字或Date()格式）
 * @param {string} fmt 'yyyy/MM/dd hh:mm:ss'
 * @return {string} 格式化后的内容
 */
export default function(date, fmt = 'yyyy/MM/dd hh:mm:ss') {
  let _date;
  let _fmt = fmt;
  if (typeof date === 'number' && date > 0) {
    _date = new Date(date);
  } else if (date instanceof Date) {
    _date = date;
  } else {
    return false;
  }
  // 先处理年份
  if (/(y+)/.test(fmt)) {
    const year = _date.getFullYear().toString();
    _fmt = _fmt.replace(RegExp.$1, RegExp.$1.length > 4 ? year : year.substr(4 - RegExp.$1.length));
  }
  // 再处理其余时间
  const dateRegExpMap = {
    'M+': _date.getMonth() + 1,
    'd+': _date.getDate(),
    'h+': _date.getHours(),
    'm+': _date.getMinutes(),
    's+': _date.getSeconds()
  };
  Object.keys(dateRegExpMap).forEach((key) => {
    if (new RegExp(`(${key})`).test(fmt)) {
      const str = `${dateRegExpMap[key]}`;
      _fmt = _fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? str : `00${str}`.substr(str.length));
    }
  });
  return _fmt;
}
