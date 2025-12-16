
import React, { useState } from 'react';
import { LifeDestinyResult, Gender } from '../types';
import { Copy, CheckCircle, AlertCircle, Upload, Sparkles, MessageSquare, ArrowRight, Calendar, MapPin, Clock, Wand2 } from 'lucide-react';
import { BAZI_SYSTEM_INSTRUCTION } from '../constants';
import { calculateBazi } from '../services/baziService';

interface ImportDataModeProps {
    onDataImport: (data: LifeDestinyResult) => void;
}

const ImportDataMode: React.FC<ImportDataModeProps> = ({ onDataImport }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    
    // 自动排盘输入
    const [autoInput, setAutoInput] = useState({
        name: '',
        gender: Gender.MALE,
        birthDate: '',
        birthTime: '',
        birthPlace: '北京',
    });
    
    // 排盘结果
    const [baziInfo, setBaziInfo] = useState({
        name: '',
        gender: 'Male',
        birthYear: '',
        yearPillar: '',
        monthPillar: '',
        dayPillar: '',
        hourPillar: '',
        startAge: '',
        firstDaYun: '',
    });
    const [jsonInput, setJsonInput] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // 常见城市列表
    const commonCities = [
        '北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '重庆', '武汉', 
        '西安', '天津', '苏州', '长沙', '郑州', '济南', '青岛', '大连', '沈阳',
        '哈尔滨', '长春', '石家庄', '太原', '呼和浩特', '乌鲁木齐', '拉萨', 
        '昆明', '贵阳', '南宁', '海口', '福州', '厦门', '南昌', '合肥', '香港', '澳门', '台北'
    ];

    // 自动排盘
    const handleAutoCalculate = () => {
        try {
            if (!autoInput.birthDate || !autoInput.birthTime) {
                setError('请填写完整的出生日期和时间');
                return;
            }

            const baziResult = calculateBazi({
                birthDate: autoInput.birthDate,
                birthTime: autoInput.birthTime,
                birthPlace: autoInput.birthPlace,
                gender: autoInput.gender,
                name: autoInput.name,
            });

            // 将自动排盘结果填充到baziInfo
            setBaziInfo({
                name: autoInput.name,
                gender: autoInput.gender === Gender.MALE ? 'Male' : 'Female',
                birthYear: baziResult.birthYear.toString(),
                yearPillar: baziResult.yearPillar,
                monthPillar: baziResult.monthPillar,
                dayPillar: baziResult.dayPillar,
                hourPillar: baziResult.hourPillar,
                startAge: baziResult.startAge.toString(),
                firstDaYun: baziResult.firstDaYun,
            });

            setError(null);
        } catch (err: any) {
            setError(err.message || '排盘失败，请检查输入信息');
        }
    };

    // 计算大运方向
    const getDaYunDirection = () => {
        if (!baziInfo.yearPillar) return { isForward: true, text: '顺行 (Forward)' };
        const firstChar = baziInfo.yearPillar.trim().charAt(0);
        const yangStems = ['甲', '丙', '戊', '庚', '壬'];

        const isYangYear = yangStems.includes(firstChar);
        const isForward = baziInfo.gender === 'Male' ? isYangYear : !isYangYear;

        return {
            isForward,
            text: isForward ? '顺行 (Forward)' : '逆行 (Backward)'
        };
    };

    // 生成用户提示词
    const generateUserPrompt = () => {
        const { isForward, text: daYunDirectionStr } = getDaYunDirection();
        const genderStr = baziInfo.gender === 'Male' ? '男 (乾造)' : '女 (坤造)';
        const startAgeInt = parseInt(baziInfo.startAge) || 1;

        const directionExample = isForward
            ? "例如：第一步是【戊申】，第二步则是【己酉】（顺排）"
            : "例如：第一步是【戊申】，第二步则是【丁未】（逆排）";

        const yearStemPolarity = (() => {
            const firstChar = baziInfo.yearPillar.trim().charAt(0);
            const yangStems = ['甲', '丙', '戊', '庚', '壬'];
            return yangStems.includes(firstChar) ? '阳' : '阴';
        })();

        return `请根据以下**已经排好的**八字四柱和**指定的大运信息**进行分析。

【基本信息】
性别：${genderStr}
姓名：${baziInfo.name || "未提供"}
出生年份：${baziInfo.birthYear}年 (阳历)

【八字四柱】
年柱：${baziInfo.yearPillar} (天干属性：${yearStemPolarity})
月柱：${baziInfo.monthPillar}
日柱：${baziInfo.dayPillar}
时柱：${baziInfo.hourPillar}

【大运核心参数】
1. 起运年龄：${baziInfo.startAge} 岁 (虚岁)。
2. 第一步大运：${baziInfo.firstDaYun}。
3. **排序方向**：${daYunDirectionStr}。

【必须执行的算法 - 大运序列生成】
请严格按照以下步骤生成数据：

1. **锁定第一步**：确认【${baziInfo.firstDaYun}】为第一步大运。
2. **计算序列**：根据六十甲子顺序和方向（${daYunDirectionStr}），推算出接下来的 9 步大运。
   ${directionExample}
3. **填充 JSON**：
   - Age 1 到 ${startAgeInt - 1}: daYun = "童限"
   - Age ${startAgeInt} 到 ${startAgeInt + 9}: daYun = [第1步大运: ${baziInfo.firstDaYun}]
   - Age ${startAgeInt + 10} 到 ${startAgeInt + 19}: daYun = [第2步大运]
   - ...以此类推直到 100 岁。

【特别警告】
- **daYun 字段**：必须填大运干支（10年一变），**绝对不要**填流年干支。
- **ganZhi 字段**：填入该年份的**流年干支**（每年一变，例如 2024=甲辰，2025=乙巳）。

任务：
1. 确认格局与喜忌。
2. 生成 **1-100 岁 (虚岁)** 的人生流年K线数据。
3. 在 \`reason\` 字段中提供流年详批。
4. 生成带评分的命理分析报告（包含性格分析、币圈交易分析、发展风水分析）。

请严格按照系统指令生成 JSON 数据。务必只返回纯JSON格式数据，不要包含任何markdown代码块标记或其他文字说明。`;
    };

    // 复制完整提示词
    const copyFullPrompt = async () => {
        const fullPrompt = `=== 系统指令 (System Prompt) ===\n\n${BAZI_SYSTEM_INSTRUCTION}\n\n=== 用户提示词 (User Prompt) ===\n\n${generateUserPrompt()}`;

        try {
            await navigator.clipboard.writeText(fullPrompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('复制失败', err);
        }
    };

    // 解析导入的 JSON
    const handleImport = () => {
        setError(null);

        if (!jsonInput.trim()) {
            setError('请粘贴 AI 返回的 JSON 数据');
            return;
        }

        try {
            // 尝试从可能包含 markdown 的内容中提取 JSON
            let jsonContent = jsonInput.trim();

            // 提取 ```json ... ``` 中的内容
            const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonContent = jsonMatch[1].trim();
            } else {
                // 尝试找到 JSON 对象
                const jsonStartIndex = jsonContent.indexOf('{');
                const jsonEndIndex = jsonContent.lastIndexOf('}');
                if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                    jsonContent = jsonContent.substring(jsonStartIndex, jsonEndIndex + 1);
                }
            }

            const data = JSON.parse(jsonContent);

            // 校验数据
            if (!data.chartPoints || !Array.isArray(data.chartPoints)) {
                throw new Error('数据格式不正确：缺少 chartPoints 数组');
            }

            if (data.chartPoints.length < 10) {
                throw new Error('数据不完整：chartPoints 数量太少');
            }

            // 转换为应用所需格式
            const result: LifeDestinyResult = {
                chartData: data.chartPoints,
                analysis: {
                    bazi: data.bazi || [],
                    summary: data.summary || "无摘要",
                    summaryScore: data.summaryScore || 5,
                    personality: data.personality || "无性格分析",
                    personalityScore: data.personalityScore || 5,
                    industry: data.industry || "无",
                    industryScore: data.industryScore || 5,
                    fengShui: data.fengShui || "建议多亲近自然，保持心境平和。",
                    fengShuiScore: data.fengShuiScore || 5,
                    wealth: data.wealth || "无",
                    wealthScore: data.wealthScore || 5,
                    marriage: data.marriage || "无",
                    marriageScore: data.marriageScore || 5,
                    health: data.health || "无",
                    healthScore: data.healthScore || 5,
                    family: data.family || "无",
                    familyScore: data.familyScore || 5,
                    crypto: data.crypto || "暂无交易分析",
                    cryptoScore: data.cryptoScore || 5,
                    cryptoYear: data.cryptoYear || "待定",
                    cryptoStyle: data.cryptoStyle || "现货定投",
                },
            };

            onDataImport(result);
        } catch (err: any) {
            setError(`解析失败：${err.message}`);
        }
    };

    const isStep1Valid = baziInfo.yearPillar && baziInfo.monthPillar && baziInfo.dayPillar && baziInfo.hourPillar && baziInfo.startAge && baziInfo.firstDaYun;

    return (
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            {/* 步骤指示器 */}
            <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                    <React.Fragment key={s}>
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step === s
                                ? 'bg-indigo-600 text-white scale-110'
                                : step > s
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-500'
                                }`}
                        >
                            {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                        </div>
                        {s < 3 && <div className={`w-16 h-1 rounded ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {/* 步骤 1: 输入八字信息 */}
            {step === 1 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold font-serif-sc text-gray-800 mb-2">第一步：输入八字信息</h2>
                        <p className="text-gray-500 text-sm">填写出生信息，系统将自动排盘</p>
                    </div>

                    {/* 自动排盘 */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
                            <div className="flex items-center gap-2 mb-3 text-blue-800 text-sm font-bold">
                                <Calendar className="w-4 h-4" />
                                <span>自动排盘信息</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">姓名 (可选)</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={autoInput.name}
                                        onChange={(e) => setAutoInput({ ...autoInput, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        placeholder="姓名"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">性别</label>
                                    <select
                                        name="gender"
                                        value={autoInput.gender}
                                        onChange={(e) => setAutoInput({ ...autoInput, gender: e.target.value as Gender })}
                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value={Gender.MALE}>乾造 (男)</option>
                                        <option value={Gender.FEMALE}>坤造 (女)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-600 mb-1">
                                    <Calendar className="w-3 h-3 inline mr-1" />
                                    出生日期 (公历)
                                </label>
                                <input
                                    type="date"
                                    name="birthDate"
                                    value={autoInput.birthDate}
                                    onChange={(e) => setAutoInput({ ...autoInput, birthDate: e.target.value })}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white font-bold text-gray-900 shadow-sm cursor-pointer
                                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                               hover:border-blue-400 transition-colors duration-150"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-600 mb-1">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    出生时间
                                </label>
                                <input
                                    type="time"
                                    name="birthTime"
                                    value={autoInput.birthTime}
                                    onChange={(e) => setAutoInput({ ...autoInput, birthTime: e.target.value })}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-600 mb-1">
                                    <MapPin className="w-3 h-3 inline mr-1" />
                                    出生地点
                                </label>
                                <select
                                    name="birthPlace"
                                    value={autoInput.birthPlace}
                                    onChange={(e) => setAutoInput({ ...autoInput, birthPlace: e.target.value })}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold"
                                >
                                    {commonCities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>

                            {error && (
                                <div className="text-red-600 text-xs mb-2 bg-red-50 p-2 rounded border border-red-200">
                                    {error}
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
                            {baziInfo.yearPillar && (
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-xs font-bold text-green-800 mb-2">排盘结果：</p>
                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        <div>
                                            <div className="text-xs text-gray-500">年柱</div>
                                            <div className="font-serif-sc font-bold text-green-700">{baziInfo.yearPillar}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">月柱</div>
                                            <div className="font-serif-sc font-bold text-green-700">{baziInfo.monthPillar}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">日柱</div>
                                            <div className="font-serif-sc font-bold text-green-700">{baziInfo.dayPillar}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">时柱</div>
                                            <div className="font-serif-sc font-bold text-green-700">{baziInfo.hourPillar}</div>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-green-700">
                                        大运：{baziInfo.firstDaYun} | 起运：{baziInfo.startAge}岁
                                    </div>
                                </div>
                            )}
                        </div>

                    <button
                        onClick={() => setStep(2)}
                        disabled={!isStep1Valid}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        下一步：生成提示词 <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* 步骤 2: 复制提示词 */}
            {step === 2 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold font-serif-sc text-gray-800 mb-2">第二步：复制提示词</h2>
                        <p className="text-gray-500 text-sm">将提示词粘贴到任意 AI 聊天工具</p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3 mb-4">
                            <MessageSquare className="w-6 h-6 text-blue-600" />
                            <div>
                                <h3 className="font-bold text-gray-800">支持的 AI 工具</h3>
                                <p className="text-sm text-gray-600">ChatGPT、Claude、Gemini、通义千问、文心一言 等</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-64 overflow-y-auto mb-4">
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                                {generateUserPrompt().substring(0, 500)}...
                            </pre>
                        </div>

                        <button
                            onClick={copyFullPrompt}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${copied
                                ? 'bg-green-500 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                        >
                            {copied ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    已复制到剪贴板！
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5" />
                                    复制完整提示词
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <h4 className="font-bold text-amber-800 mb-2">📝 使用说明</h4>
                        <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                            <li>点击上方按钮复制提示词</li>
                            <li>打开任意 AI 聊天工具（如 ChatGPT）</li>
                            <li>粘贴提示词并发送</li>
                            <li>等待 AI 生成完整的 JSON 数据</li>
                            <li>复制 AI 的回复，回到这里进行下一步</li>
                        </ol>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep(1)}
                            className="flex-1 py-3 rounded-xl font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                        >
                            ← 上一步
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            下一步：导入数据 <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* 步骤 3: 导入 JSON */}
            {step === 3 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold font-serif-sc text-gray-800 mb-2">第三步：导入 AI 回复</h2>
                        <p className="text-gray-500 text-sm">粘贴 AI 返回的 JSON 数据</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            <Upload className="w-4 h-4 inline mr-2" />
                            粘贴 AI 返回的 JSON 数据
                        </label>
                        <textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder='将 AI 返回的 JSON 数据粘贴到这里...&#10;&#10;例如:&#10;{&#10;  "bazi": ["癸未", "壬戌", "丙子", "庚寅"],&#10;  "chartPoints": [...],&#10;  ...&#10;}'
                            className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs resize-none"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep(2)}
                            className="flex-1 py-3 rounded-xl font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                        >
                            ← 上一步
                        </button>
                        <button
                            onClick={handleImport}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-5 h-5" />
                            生成人生K线
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportDataMode;
