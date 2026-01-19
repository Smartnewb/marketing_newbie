import React, { useState, useEffect } from 'react';
import { UsageTracker } from '../utils/UsageTracker';
import { BarChart, PieChart, Activity, DollarSign, AlertTriangle, Settings, TrendingUp, Sparkles, Image as ImageIcon, MessageSquare, RefreshCw } from 'lucide-react';

function Dashboard() {
    const [logs, setLogs] = useState([]);
    const [budget, setBudget] = useState({ monthly_limit: 10, current_spend: 0 });
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [newLimit, setNewLimit] = useState(10);
    const [showKRW, setShowKRW] = useState(true); // 원화 표시 여부
    const [exchangeRate, setExchangeRate] = useState(1450); // 기본 환율 (fallback)
    const [rateUpdatedAt, setRateUpdatedAt] = useState(null);
    const [isLoadingRate, setIsLoadingRate] = useState(false);

    useEffect(() => {
        // Load data on mount
        refreshData();
        fetchExchangeRate();
        // Set up interval for real-time updates
        const interval = setInterval(refreshData, 2000);
        return () => clearInterval(interval);
    }, []);

    const refreshData = () => {
        setLogs(UsageTracker.getLogs());
        setBudget(UsageTracker.getBudget());
    };

    // 실시간 환율 가져오기 (무료 API 사용)
    const fetchExchangeRate = async () => {
        setIsLoadingRate(true);
        try {
            // 무료 환율 API 사용 (exchangerate-api.com 또는 다른 무료 API)
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            if (data.rates && data.rates.KRW) {
                setExchangeRate(data.rates.KRW);
                setRateUpdatedAt(new Date());
            }
        } catch (error) {
            console.error('환율 정보 가져오기 실패:', error);
            // Fallback: 고정 환율 사용
            setExchangeRate(1450);
        } finally {
            setIsLoadingRate(false);
        }
    };

    // USD를 KRW로 변환
    const toKRW = (usd) => {
        return usd * exchangeRate;
    };

    // 금액 포맷팅 (달러 또는 원화)
    const formatCurrency = (usd, decimals = 2) => {
        if (showKRW) {
            const krw = toKRW(usd);
            if (krw >= 1000) {
                return `₩${krw.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}`;
            }
            return `₩${krw.toFixed(decimals)}`;
        }
        return `$${usd.toFixed(decimals > 2 ? decimals : 4)}`;
    };

    const handleSaveBudget = () => {
        const updated = { ...budget, monthly_limit: parseFloat(newLimit) };
        UsageTracker.saveBudget(updated);
        setBudget(updated);
        setIsEditingBudget(false);
    };

    // Calculate Statistics
    const totalCost = budget.current_spend;
    const projectCost = totalCost * 1.5; // Simple projection
    const progress = Math.min((totalCost / budget.monthly_limit) * 100, 100);

    // Separate APIs: OpenAI vs Seedream
    const openAIModels = ['gpt-4o', 'gpt-5.2', 'dall-e-3'];
    const seedreamModels = ['seedream-4-5', 'seedream-4.5', 'seedream'];

    const openAILogs = logs.filter(log => openAIModels.some(m => log.model?.toLowerCase().includes(m.toLowerCase())));
    const seedreamLogs = logs.filter(log => seedreamModels.some(m => log.model?.toLowerCase().includes(m.toLowerCase())) || log.model?.toLowerCase().includes('seedream'));

    const openAICost = openAILogs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const seedreamCost = seedreamLogs.reduce((sum, log) => sum + (log.cost || 0), 0);

    // Group by Model for breakdown
    const modelCosts = logs.reduce((acc, log) => {
        acc[log.model] = (acc[log.model] || 0) + log.cost;
        return acc;
    }, {});

    // Feature ID 한국어 변환
    const translateFeature = (featureId) => {
        const translations = {
            'Planner': '기획',
            'Planner (Mock)': '기획 (테스트)',
            'Creator': '제작',
            'Chat': 'AI 채팅',
            'General': '일반',
        };
        return translations[featureId] || featureId;
    };

    // Model 이름 한글화
    const translateModel = (model) => {
        const translations = {
            'gpt-4o': 'GPT-4o (텍스트)',
            'gpt-5.2': 'GPT-5.2 (텍스트)',
            'dall-e-3': 'DALL-E 3 (이미지)',
            'seedream-4-5': 'Seedream 4.5 (이미지)',
            'seedream-4.5': 'Seedream 4.5 (이미지)',
            'seedream': 'Seedream (이미지)',
            'pollinations-free': 'Pollinations (무료)',
            'pollinations-fallback': 'Pollinations (Fallback)',
        };
        return translations[model] || model;
    };

    return (
        <div className="custom-scrollbar" style={{ padding: '32px', height: '100%', overflowY: 'auto', backgroundColor: '#F8FAFC' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1E293B', marginBottom: '8px' }}>📊 AI 사용량 & 비용 대시보드</h1>
                        <p style={{ color: '#64748B' }}>AI 모델별 사용량과 비용을 실시간으로 확인하세요.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* 환율 토글 */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            fontSize: '13px'
                        }}>
                            <span style={{ color: !showKRW ? '#7A4AE2' : '#94A3B8', fontWeight: !showKRW ? '700' : '500' }}>$</span>
                            <button
                                onClick={() => setShowKRW(!showKRW)}
                                style={{
                                    width: '44px',
                                    height: '24px',
                                    borderRadius: '12px',
                                    backgroundColor: showKRW ? '#7A4AE2' : '#CBD5E1',
                                    border: 'none',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    backgroundColor: 'white',
                                    position: 'absolute',
                                    top: '3px',
                                    left: showKRW ? '23px' : '3px',
                                    transition: 'left 0.2s',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                }} />
                            </button>
                            <span style={{ color: showKRW ? '#7A4AE2' : '#94A3B8', fontWeight: showKRW ? '700' : '500' }}>₩</span>
                            {showKRW && (
                                <button
                                    onClick={fetchExchangeRate}
                                    disabled={isLoadingRate}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        marginLeft: '4px',
                                        padding: '4px 8px',
                                        backgroundColor: '#F1F5F9',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        color: '#64748B'
                                    }}
                                    title="환율 새로고침"
                                >
                                    <RefreshCw size={12} className={isLoadingRate ? 'animate-spin' : ''} />
                                    {exchangeRate.toFixed(0)}원
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: '600' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E', boxShadow: '0 0 8px #22C55E' }}></div>
                            실시간 모니터링 중
                        </div>
                    </div>
                </div>

                {/* Total Cost Card */}
                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <DollarSign size={16} /> 이번 달 총 사용 비용
                        </span>
                        <span style={{ fontSize: '12px', color: totalCost > budget.monthly_limit * 0.8 ? '#EF4444' : '#22C55E', backgroundColor: totalCost > budget.monthly_limit * 0.8 ? '#FEE2E2' : '#DCFCE7', padding: '4px 8px', borderRadius: '8px', fontWeight: '700' }}>
                            {totalCost > budget.monthly_limit * 0.8 ? '⚠️ 주의' : '✅ 정상'}
                        </span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: '#1E293B', marginBottom: '8px' }}>
                        {formatCurrency(totalCost)} <span style={{ fontSize: '16px', color: '#94A3B8', fontWeight: '500' }}>/ {formatCurrency(budget.monthly_limit)} (한도)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', backgroundColor: totalCost > budget.monthly_limit ? '#EF4444' : '#7A4AE2', transition: 'width 0.5s ease' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '13px' }}>
                        <span style={{ color: '#64748B' }}>{(progress).toFixed(1)}% 사용</span>
                        {isEditingBudget ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="number" value={newLimit} onChange={e => setNewLimit(e.target.value)} style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #CBD5E1' }} />
                                <button onClick={handleSaveBudget} style={{ fontSize: '12px', fontWeight: '700', color: '#7A4AE2', background: 'none', border: 'none', cursor: 'pointer' }}>저장</button>
                            </div>
                        ) : (
                            <button onClick={() => { setIsEditingBudget(true); setNewLimit(budget.monthly_limit); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#7A4AE2', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                                <Settings size={12} /> 한도 설정
                            </button>
                        )}
                    </div>
                </div>

                {/* API별 분리 카드 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>

                    {/* OpenAI Card */}
                    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', border: '2px solid #10A37F', boxShadow: '0 4px 20px rgba(16,163,127,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#10A37F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MessageSquare size={24} color="white" />
                            </div>
                            <div>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>OpenAI</div>
                                <div style={{ fontSize: '12px', color: '#64748B' }}>GPT-4o, DALL-E 3</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <div style={{ fontSize: '28px', fontWeight: '800', color: '#10A37F' }}>{formatCurrency(openAICost)}</div>
                                <div style={{ fontSize: '12px', color: '#94A3B8' }}>총 비용</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '28px', fontWeight: '800', color: '#1E293B' }}>{openAILogs.length}</div>
                                <div style={{ fontSize: '12px', color: '#94A3B8' }}>요청 수</div>
                            </div>
                        </div>
                        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#F0FDF9', borderRadius: '12px', fontSize: '13px', color: '#047857' }}>
                            💬 텍스트 생성 & 이미지 생성에 사용
                        </div>
                    </div>

                    {/* Seedream Card */}
                    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', border: '2px solid #7A4AE2', boxShadow: '0 4px 20px rgba(122,74,226,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#7A4AE2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ImageIcon size={24} color="white" />
                            </div>
                            <div>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B' }}>Seedream 4.5</div>
                                <div style={{ fontSize: '12px', color: '#64748B' }}>카카오 이미지 생성 AI</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <div style={{ fontSize: '28px', fontWeight: '800', color: '#7A4AE2' }}>{formatCurrency(seedreamCost)}</div>
                                <div style={{ fontSize: '12px', color: '#94A3B8' }}>총 비용</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '28px', fontWeight: '800', color: '#1E293B' }}>{seedreamLogs.length}</div>
                                <div style={{ fontSize: '12px', color: '#94A3B8' }}>요청 수</div>
                            </div>
                        </div>
                        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#F5F3FF', borderRadius: '12px', fontSize: '13px', color: '#6D28D9' }}>
                            🎨 고품질 한국형 이미지 생성에 특화
                        </div>
                    </div>
                </div>

                {/* 예상 비용 & 통계 */}
                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', marginBottom: '32px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <TrendingUp size={16} /> 예상 비용 & 통계
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{formatCurrency(projectCost)}</div>
                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>월말 예상 비용</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{logs.length}</div>
                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>총 API 요청 수</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B' }}>{Object.keys(modelCosts).length}</div>
                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>사용 중인 모델 수</div>
                        </div>
                    </div>

                    {/* Model Breakdown */}
                    <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: '#64748B' }}>
                        {Object.entries(modelCosts).map(([model, cost]) => (
                            <div key={model} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F8FAFC', padding: '6px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: model.includes('gpt') || model.includes('dall') ? '#10A37F' : '#7A4AE2' }}></div>
                                <span style={{ fontWeight: '600', color: '#334155' }}>{translateModel(model)}</span>
                                <span style={{ color: '#64748B' }}>{formatCurrency(cost)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity Table */}
                <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={18} color="#64748B" />
                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B' }}>최근 사용 기록</span>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead style={{ backgroundColor: '#F8FAFC', color: '#64748B', fontWeight: '600', textAlign: 'left' }}>
                                <tr>
                                    <th style={{ padding: '12px 24px' }}>기능</th>
                                    <th style={{ padding: '12px 24px' }}>모델</th>
                                    <th style={{ padding: '12px 24px' }}>토큰 (입력/출력)</th>
                                    <th style={{ padding: '12px 24px' }}>비용 {showKRW ? '(KRW)' : '(USD)'}</th>
                                    <th style={{ padding: '12px 24px' }}>시간</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.slice(0, 10).map((log) => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '16px 24px', fontWeight: '600', color: '#334155' }}>{translateFeature(log.feature_id)}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                backgroundColor: log.model?.includes('gpt') || log.model?.includes('dall') ? '#F0FDF9' : '#F5F3FF',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                color: log.model?.includes('gpt') || log.model?.includes('dall') ? '#047857' : '#6D28D9'
                                            }}>
                                                {translateModel(log.model)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', color: '#64748B' }}>
                                            {log.type === 'text' ? `${log.input_tokens} / ${log.output_tokens}` : '-'}
                                        </td>
                                        <td style={{ padding: '16px 24px', fontWeight: '700', color: '#1E293B' }}>
                                            {formatCurrency(log.cost, 4)}
                                        </td>
                                        <td style={{ padding: '16px 24px', color: '#94A3B8', fontSize: '13px' }}>
                                            {new Date(log.timestamp).toLocaleTimeString('ko-KR')}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                                            아직 API 사용 기록이 없습니다. 기능을 사용해보세요! 🚀
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Dashboard;

