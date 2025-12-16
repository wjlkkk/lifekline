/**
 * 八字排盘服务
 * 根据公历日期、时间、地点和性别自动计算八字四柱和大运
 */

// 天干数组
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
// 地支数组
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
// 六十甲子
const JIA_ZI = (() => {
  const result: string[] = [];
  for (let i = 0; i < 60; i++) {
    result.push(TIAN_GAN[i % 10] + DI_ZHI[i % 12]);
  }
  return result;
})();

// 月柱地支（根据节气）
const MONTH_ZHI = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];

// 时柱地支
const HOUR_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 时柱天干对应表（根据日柱天干）
const HOUR_GAN_TABLE: { [key: string]: string[] } = {
  '甲': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'],
  '乙': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'],
  '丙': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'],
  '丁': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'],
  '戊': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
  '己': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'],
  '庚': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'],
  '辛': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'],
  '壬': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'],
  '癸': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
};

// 月柱天干对应表（根据年柱天干）
const MONTH_GAN_TABLE: { [key: string]: string[] } = {
  '甲': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'],
  '乙': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'],
  '丙': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'],
  '丁': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
  '戊': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'],
  '己': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'],
  '庚': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'],
  '辛': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'],
  '壬': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
  '癸': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'],
};

// 节气时间表（简化版，使用固定日期，实际应使用精确的节气时间）
// 当前使用简化算法，暂不使用此表
// const JIE_QI = [
//   { month: 2, day: 4 },   // 立春 (2月4日左右)
//   { month: 3, day: 6 },    // 惊蛰 (3月6日左右)
//   { month: 4, day: 5 },   // 清明 (4月5日左右)
//   { month: 5, day: 6 },   // 立夏 (5月6日左右)
//   { month: 6, day: 6 },   // 芒种 (6月6日左右)
//   { month: 7, day: 7 },   // 小暑 (7月7日左右)
//   { month: 8, day: 8 },   // 立秋 (8月8日左右)
//   { month: 9, day: 8 },   // 白露 (9月8日左右)
//   { month: 10, day: 8 },  // 寒露 (10月8日左右)
//   { month: 11, day: 7 },  // 立冬 (11月7日左右)
//   { month: 12, day: 7 },  // 大雪 (12月7日左右)
//   { month: 1, day: 6 },   // 小寒 (1月6日左右)
// ];

/**
 * 获取农历年份（简化版，使用公历年份）
 * 实际应用中应使用农历转换库
 */
function getLunarYear(year: number): number {
  // 简化处理：1900年为庚子年
  const baseYear = 1900;
  const baseGanZhiIndex = 36; // 庚子
  const diff = year - baseYear;
  return (baseGanZhiIndex + diff) % 60;
}

/**
 * 计算年柱
 */
function getYearPillar(year: number): string {
  const index = getLunarYear(year);
  return JIA_ZI[index];
}

/**
 * 计算月柱
 */
function getMonthPillar(year: number, month: number, day: number): string {
  // 判断是否在立春之后（简化处理）
  const isAfterLiChun = month > 2 || (month === 2 && day >= 4);
  const lunarMonth = isAfterLiChun ? month - 1 : month === 1 ? 12 : month - 1;
  
  const yearGan = getYearPillar(year)[0];
  const monthGan = MONTH_GAN_TABLE[yearGan][lunarMonth - 1];
  const monthZhi = MONTH_ZHI[lunarMonth - 1];
  
  return monthGan + monthZhi;
}

/**
 * 计算日柱（使用公式法）
 * 1900年1月1日为甲子日
 */
function getDayPillar(year: number, month: number, day: number): string {
  // 简化公式：1900年1月1日为甲子日（索引0）
  const baseDate = new Date(1900, 0, 1);
  const targetDate = new Date(year, month - 1, day);
  const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  const index = (diffDays + 60) % 60;
  return JIA_ZI[index];
}

/**
 * 计算时柱
 */
function getHourPillar(year: number, month: number, day: number, hour: number): string {
  const dayGan = getDayPillar(year, month, day)[0];
  
  // 根据时辰计算（简化：23-1子时，1-3丑时...）
  let hourIndex = Math.floor((hour + 1) / 2) % 12;
  if (hour === 23 || hour === 0) hourIndex = 0; // 子时
  
  const hourGan = HOUR_GAN_TABLE[dayGan][hourIndex];
  const hourZhi = HOUR_ZHI[hourIndex];
  
  return hourGan + hourZhi;
}

/**
 * 计算大运
 */
function calculateDaYun(
  yearPillar: string,
  monthPillar: string,
  gender: 'Male' | 'Female'
): { firstDaYun: string; startAge: number } {
  // 判断年柱天干阴阳
  const yearGan = yearPillar[0];
  const isYangYear = ['甲', '丙', '戊', '庚', '壬'].includes(yearGan);
  
  // 判断大运方向
  const isForward = (gender === 'Male' && isYangYear) || (gender === 'Female' && !isYangYear);
  
  // 找到月柱在六十甲子中的位置
  const monthIndex = JIA_ZI.indexOf(monthPillar);
  if (monthIndex === -1) {
    throw new Error('无法计算大运：月柱无效');
  }
  
  // 计算第一步大运
  let firstDaYunIndex: number;
  if (isForward) {
    // 顺行：月柱的下一个
    firstDaYunIndex = (monthIndex + 1) % 60;
  } else {
    // 逆行：月柱的上一个
    firstDaYunIndex = (monthIndex - 1 + 60) % 60;
  }
  
  const firstDaYun = JIA_ZI[firstDaYunIndex];
  
  // 计算起运年龄（简化：使用固定算法）
  // 实际应使用精确的节气时间计算
  const startAge = 1; // 简化处理，默认1岁起运
  
  return { firstDaYun, startAge };
}

/**
 * 根据时区偏移调整时间（预留功能，当前简化处理）
 */
// function adjustTimeByTimezone(date: Date, timezoneOffset: number): Date {
//   // timezoneOffset: 时区偏移（小时），例如北京+8
//   const localTime = new Date(date);
//   const utcTime = localTime.getTime() + (localTime.getTimezoneOffset() * 60000);
//   const targetTime = new Date(utcTime + (timezoneOffset * 3600000));
//   return targetTime;
// }

/**
 * 主要排盘函数
 */
export interface BaziInput {
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:mm
  birthPlace: string; // 出生地点
  gender: 'Male' | 'Female';
  name?: string;
}

export interface BaziResult {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  firstDaYun: string;
  startAge: number;
  birthYear: number;
}

/**
 * 城市时区映射（简化版，预留功能）
 */
// const CITY_TIMEZONE: { [key: string]: number } = {
//   '北京': 8, '上海': 8, '广州': 8, '深圳': 8, '杭州': 8, '南京': 8,
//   '成都': 8, '重庆': 8, '武汉': 8, '西安': 8, '天津': 8, '苏州': 8,
//   '长沙': 8, '郑州': 8, '济南': 8, '青岛': 8, '大连': 8, '沈阳': 8,
//   '哈尔滨': 8, '长春': 8, '石家庄': 8, '太原': 8, '呼和浩特': 8,
//   '乌鲁木齐': 6, '拉萨': 8, '昆明': 8, '贵阳': 8, '南宁': 8,
//   '海口': 8, '福州': 8, '厦门': 8, '南昌': 8, '合肥': 8,
//   '香港': 8, '澳门': 8, '台北': 8,
// };

export function calculateBazi(input: BaziInput): BaziResult {
  // 解析日期和时间
  const [year, month, day] = input.birthDate.split('-').map(Number);
  const [hour] = input.birthTime.split(':').map(Number);
  
  if (!year || !month || !day || hour === undefined) {
    throw new Error('日期或时间格式不正确');
  }
  
  // 获取时区（简化：默认使用北京时间，预留功能）
  // const timezone = CITY_TIMEZONE[input.birthPlace] || 8;
  
  // 计算四柱
  const yearPillar = getYearPillar(year);
  const monthPillar = getMonthPillar(year, month, day);
  const dayPillar = getDayPillar(year, month, day);
  const hourPillar = getHourPillar(year, month, day, hour);
  
  // 计算大运
  const { firstDaYun, startAge } = calculateDaYun(
    yearPillar,
    monthPillar,
    input.gender
  );
  
  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    firstDaYun,
    startAge,
    birthYear: year,
  };
}

