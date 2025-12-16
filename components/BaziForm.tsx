
import React, { useState, useMemo } from 'react';
import { UserInput, Gender } from '../types';
import { Loader2, Sparkles, TrendingUp, Settings, Calendar, MapPin, Clock, Wand2 } from 'lucide-react';
import { calculateBazi } from '../services/baziService';

interface BaziFormProps {
  onSubmit: (data: UserInput) => void;
  isLoading: boolean;
}

type InputMode = 'auto' | 'manual';

const BaziForm: React.FC<BaziFormProps> = ({ onSubmit, isLoading }) => {
  const [inputMode, setInputMode] = useState<InputMode>('auto');
  
  // 自动排盘模式的数据
  const [autoInput, setAutoInput] = useState({
    name: '',
    gender: Gender.MALE,
    birthDate: '',
    birthTime: '',
    birthPlace: '北京',
  });

  // 手动输入模式的数据
  const [formData, setFormData] = useState<UserInput>({
    name: '',
    gender: Gender.MALE,
    birthYear: '',
    yearPillar: '',
    monthPillar: '',
    dayPillar: '',
    hourPillar: '',
    startAge: '',
    firstDaYun: '',
    modelName: 'gemini-3-pro-preview',
    apiBaseUrl: 'https://max.openai365.top/v1',
    apiKey: '',
  });

  const [formErrors, setFormErrors] = useState<{ 
    modelName?: string, 
    apiBaseUrl?: string, 
    apiKey?: string,
    autoInput?: string 
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (name === 'apiBaseUrl' || name === 'apiKey' || name === 'modelName') {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleAutoInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAutoInput((prev) => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, autoInput: undefined }));
  };

  // 自动排盘
  const handleAutoCalculate = () => {
    try {
      if (!autoInput.birthDate || !autoInput.birthTime) {
        setFormErrors({ autoInput: '请填写完整的出生日期和时间' });
        return;
      }

      const baziResult = calculateBazi({
        birthDate: autoInput.birthDate,
        birthTime: autoInput.birthTime,
        birthPlace: autoInput.birthPlace,
        gender: autoInput.gender,
        name: autoInput.name,
      });

      // 将自动排盘结果填充到表单
      setFormData(prev => ({
        ...prev,
        name: autoInput.name,
        gender: autoInput.gender,
        birthYear: baziResult.birthYear.toString(),
        yearPillar: baziResult.yearPillar,
        monthPillar: baziResult.monthPillar,
        dayPillar: baziResult.dayPillar,
        hourPillar: baziResult.hourPillar,
        startAge: baziResult.startAge.toString(),
        firstDaYun: baziResult.firstDaYun,
      }));

      setFormErrors({});
    } catch (error: any) {
      setFormErrors({ autoInput: error.message || '排盘失败，请检查输入信息' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 如果是自动模式，先执行排盘
    if (inputMode === 'auto') {
      if (!autoInput.birthDate || !autoInput.birthTime) {
        setFormErrors({ autoInput: '请填写完整的出生日期和时间' });
        return;
      }

      try {
        const baziResult = calculateBazi({
          birthDate: autoInput.birthDate,
          birthTime: autoInput.birthTime,
          birthPlace: autoInput.birthPlace,
          gender: autoInput.gender,
          name: autoInput.name,
        });

        // 将自动排盘结果填充到表单
        const updatedFormData = {
          ...formData,
          name: autoInput.name,
          gender: autoInput.gender,
          birthYear: baziResult.birthYear.toString(),
          yearPillar: baziResult.yearPillar,
          monthPillar: baziResult.monthPillar,
          dayPillar: baziResult.dayPillar,
          hourPillar: baziResult.hourPillar,
          startAge: baziResult.startAge.toString(),
          firstDaYun: baziResult.firstDaYun,
        };
        
        setFormData(updatedFormData);
        
        // 继续验证和提交
        validateAndSubmit(updatedFormData);
      } catch (error: any) {
        setFormErrors({ autoInput: error.message || '排盘失败，请检查输入信息' });
        return;
      }
    } else {
      // 手动模式直接验证和提交
      validateAndSubmit(formData);
    }
  };

  const validateAndSubmit = (data: UserInput) => {
    // Validate API Config
    const errors: { modelName?: string, apiBaseUrl?: string, apiKey?: string } = {};
    if (!data.modelName.trim()) {
      errors.modelName = '请输入模型名称';
    }
    if (!data.apiBaseUrl.trim()) {
      errors.apiBaseUrl = '请输入 API Base URL';
    }
    if (!data.apiKey.trim()) {
      errors.apiKey = '请输入 API Key';
    }

    // 验证八字信息
    if (!data.yearPillar || !data.monthPillar || !data.dayPillar || !data.hourPillar) {
      setFormErrors({ ...errors });
      return;
    }

    if (!data.startAge || !data.firstDaYun) {
      setFormErrors({ ...errors });
      return;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onSubmit(data);
  };

  // Calculate direction for UI feedback
  const daYunDirectionInfo = useMemo(() => {
    if (!formData.yearPillar) return '等待输入年柱...';

    const firstChar = formData.yearPillar.trim().charAt(0);
    const yinStems = ['乙', '丁', '己', '辛', '癸'];

    let isYangYear = true; // default assume Yang if unknown
    if (yinStems.includes(firstChar)) isYangYear = false;

    let isForward = false;
    if (formData.gender === Gender.MALE) {
      isForward = isYangYear; // Male Yang = Forward, Male Yin = Backward
    } else {
      isForward = !isYangYear; // Female Yin = Forward, Female Yang = Backward
    }

    return isForward ? '顺行 (阳男/阴女)' : '逆行 (阴男/阳女)';
  }, [formData.yearPillar, formData.gender]);

  // 常见城市列表
  const commonCities = [
    '北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '重庆', '武汉', 
    '西安', '天津', '苏州', '长沙', '郑州', '济南', '青岛', '大连', '沈阳',
    '哈尔滨', '长春', '石家庄', '太原', '呼和浩特', '乌鲁木齐', '拉萨', 
    '昆明', '贵阳', '南宁', '海口', '福州', '厦门', '南昌', '合肥', '香港', '澳门', '台北'
  ];

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-serif-sc font-bold text-gray-800 mb-2">八字排盘</h2>
        <p className="text-gray-500 text-sm">自动排盘或手动输入四柱信息</p>
      </div>

      {/* 模式切换 */}
      <div className="mb-6 flex bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setInputMode('auto')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition flex items-center justify-center gap-2 ${
            inputMode === 'auto'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          自动排盘
        </button>
        <button
          type="button"
          onClick={() => setInputMode('manual')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition flex items-center justify-center gap-2 ${
            inputMode === 'manual'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          手动输入
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* 自动排盘模式 */}
        {inputMode === 'auto' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 mb-3 text-blue-800 text-sm font-bold">
                <Calendar className="w-4 h-4" />
                <span>自动排盘信息</span>
              </div>

              {/* Name & Gender */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">姓名 (可选)</label>
                  <input
                    type="text"
                    name="name"
                    value={autoInput.name}
                    onChange={handleAutoInputChange}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    placeholder="姓名"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">性别</label>
                  <div className="flex bg-white rounded-lg p-1 border border-blue-200">
                    <button
                      type="button"
                      onClick={() => setAutoInput({ ...autoInput, gender: Gender.MALE })}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${
                        autoInput.gender === Gender.MALE
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      乾造 (男)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAutoInput({ ...autoInput, gender: Gender.FEMALE })}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${
                        autoInput.gender === Gender.FEMALE
                          ? 'bg-pink-600 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      坤造 (女)
                    </button>
                  </div>
                </div>
              </div>

              {/* Birth Date */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  出生日期 (公历)
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={autoInput.birthDate}
                  onChange={handleAutoInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold"
                  required
                />
              </div>

              {/* Birth Time */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  出生时间
                </label>
                <input
                  type="time"
                  name="birthTime"
                  value={autoInput.birthTime}
                  onChange={handleAutoInputChange}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold"
                  required
                />
              </div>

              {/* Birth Place */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  出生地点
                </label>
                <select
                  name="birthPlace"
                  value={autoInput.birthPlace}
                  onChange={handleAutoInputChange}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold"
                >
                  {commonCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {formErrors.autoInput && (
                <div className="text-red-600 text-xs mb-2 bg-red-50 p-2 rounded border border-red-200">
                  {formErrors.autoInput}
                </div>
              )}

              <button
                type="button"
                onClick={handleAutoCalculate}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                自动排盘
              </button>

              {/* 显示排盘结果 */}
              {formData.yearPillar && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs font-bold text-green-800 mb-2">排盘结果：</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-xs text-gray-500">年柱</div>
                      <div className="font-serif-sc font-bold text-green-700">{formData.yearPillar}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">月柱</div>
                      <div className="font-serif-sc font-bold text-green-700">{formData.monthPillar}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">日柱</div>
                      <div className="font-serif-sc font-bold text-green-700">{formData.dayPillar}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">时柱</div>
                      <div className="font-serif-sc font-bold text-green-700">{formData.hourPillar}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-green-700">
                    大运：{formData.firstDaYun} | 起运：{formData.startAge}岁
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 手动输入模式 */}
        {inputMode === 'manual' && (
          <>
            {/* Name & Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 (可选)</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: Gender.MALE })}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${formData.gender === Gender.MALE
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    乾造 (男)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: Gender.FEMALE })}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${formData.gender === Gender.FEMALE
                        ? 'bg-white text-pink-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    坤造 (女)
                  </button>
                </div>
              </div>
            </div>

            {/* Four Pillars Manual Input */}
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <div className="flex items-center gap-2 mb-3 text-amber-800 text-sm font-bold">
                <Sparkles className="w-4 h-4" />
                <span>输入四柱干支 (必填)</span>
              </div>

              {/* Birth Year Input */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-600 mb-1">出生年份 (阳历)</label>
                <input
                  type="number"
                  name="birthYear"
                  required
                  min="1900"
                  max="2100"
                  value={formData.birthYear}
                  onChange={handleChange}
                  placeholder="如: 1990"
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">年柱 (Year)</label>
                  <input
                    type="text"
                    name="yearPillar"
                    required
                    value={formData.yearPillar}
                    onChange={handleChange}
                    placeholder="如: 甲子"
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-center font-serif-sc font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">月柱 (Month)</label>
                  <input
                    type="text"
                    name="monthPillar"
                    required
                    value={formData.monthPillar}
                    onChange={handleChange}
                    placeholder="如: 丙寅"
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-center font-serif-sc font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">日柱 (Day)</label>
                  <input
                    type="text"
                    name="dayPillar"
                    required
                    value={formData.dayPillar}
                    onChange={handleChange}
                    placeholder="如: 戊辰"
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-center font-serif-sc font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">时柱 (Hour)</label>
                  <input
                    type="text"
                    name="hourPillar"
                    required
                    value={formData.hourPillar}
                    onChange={handleChange}
                    placeholder="如: 壬戌"
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-center font-serif-sc font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Da Yun Manual Input */}
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-2 mb-3 text-indigo-800 text-sm font-bold">
                <TrendingUp className="w-4 h-4" />
                <span>大运排盘信息 (必填)</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">起运年龄 (虚岁)</label>
                  <input
                    type="number"
                    name="startAge"
                    required
                    min="1"
                    max="100"
                    value={formData.startAge}
                    onChange={handleChange}
                    placeholder="如: 3"
                    className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">第一步大运</label>
                  <input
                    type="text"
                    name="firstDaYun"
                    required
                    value={formData.firstDaYun}
                    onChange={handleChange}
                    placeholder="如: 丁卯"
                    className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-center font-serif-sc font-bold"
                  />
                </div>
              </div>
              <p className="text-xs text-indigo-600/70 mt-2 text-center">
                当前大运排序规则：
                <span className="font-bold text-indigo-900">{daYunDirectionInfo}</span>
              </p>
            </div>
          </>
        )}

        {/* API Configuration Section */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-3 text-gray-700 text-sm font-bold">
            <Settings className="w-4 h-4" />
            <span>模型接口设置 (必填)</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">使用模型</label>
              <input
                type="text"
                name="modelName"
                value={formData.modelName}
                onChange={handleChange}
                placeholder="gemini-3-pro-preview"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono outline-none ${formErrors.modelName ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-gray-400'}`}
              />
              {formErrors.modelName && <p className="text-red-500 text-xs mt-1">{formErrors.modelName}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">API Base URL</label>
              <input
                type="text"
                name="apiBaseUrl"
                value={formData.apiBaseUrl}
                onChange={handleChange}
                placeholder="https://max.openai365.top/v1"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono outline-none ${formErrors.apiBaseUrl ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-gray-400'}`}
              />
              {formErrors.apiBaseUrl && <p className="text-red-500 text-xs mt-1">{formErrors.apiBaseUrl}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">API Key</label>
              <input
                type="password"
                name="apiKey"
                value={formData.apiKey}
                onChange={handleChange}
                placeholder="sk-..."
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono outline-none ${formErrors.apiKey ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-gray-400'}`}
              />
              {formErrors.apiKey && <p className="text-red-500 text-xs mt-1">{formErrors.apiKey}</p>}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-indigo-900 to-gray-900 hover:from-black hover:to-black text-white font-bold py-3.5 rounded-xl shadow-lg transform transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              <span>大师推演中(3-5分钟)</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 text-amber-300" />
              <span>生成人生K线</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default BaziForm;
