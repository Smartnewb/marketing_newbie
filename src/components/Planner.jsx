import React, { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

function Planner({ onUseIdea }) {
    const [planTopic, setPlanTopic] = useState('');
    const [planIdeas, setPlanIdeas] = useState([]);
    const [isPlanning, setIsPlanning] = useState(false);

    const handlePlanContent = async () => {
        if (!planTopic) return;
        setIsPlanning(true);
        setPlanIdeas([]);

        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

        if (!apiKey) {
            // Fallback to mock data if no API key
            setTimeout(() => {
                const ideas = [
                    { title: `"${planTopic}" 밸런스 게임`, type: 'insta_story', desc: '스토리 투표 유도', hook: '이거 못 고르면 하수? 🤔' },
                    { title: `현실적인 ${planTopic} 썰`, type: 'community', desc: '공감 유도 글', hook: '나만 이래? ㅠㅠ' },
                    { title: `${planTopic} 유형별 특징`, type: 'insta_feed', desc: '정보성 유머', hook: '내 주변에 꼭 있다 ㅋㅋ' },
                    { title: `POV: ${planTopic} 상황극`, type: 'reels_script', desc: '1인 2역 연기', hook: '소개팅 나갔는데...' },
                ];
                setPlanIdeas(ideas);
                setIsPlanning(false);
            }, 1200);
            return;
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-5.2',
                    messages: [
                        {
                            role: 'system',
                            content: `당신은 대학생/사회초년생 타겟 소개팅 앱의 마케팅 전문가입니다. 
                            20대의 언어 습관(톤앤매너)과 '외로움', '설렘' 등의 감성 키워드를 잘 활용합니다.
                            인스타그램 콘텐츠 아이디어를 JSON 형식으로 제안해주세요.`
                        },
                        {
                            role: 'user',
                            content: `"${planTopic}" 주제로 인스타그램 마케팅 콘텐츠 아이디어 4개를 제안해주세요.
                            
                            다음 JSON 형식으로만 답변해주세요 (다른 텍스트 없이):
                            [
                                {"title": "콘텐츠 제목", "type": "insta_story 또는 insta_feed 또는 reels_script 또는 community 중 하나", "desc": "간단한 설명", "hook": "관심을 끄는 한 줄 멘트"}
                            ]`
                        }
                    ],
                    temperature: 0.8,
                    max_tokens: 1000
                })
            });

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Parse JSON from response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const ideas = JSON.parse(jsonMatch[0]);
                setPlanIdeas(ideas);
            }
        } catch (error) {
            console.error('OpenAI API Error:', error);
            // Fallback to mock data on error
            const ideas = [
                { title: `"${planTopic}" 밸런스 게임`, type: 'insta_story', desc: '스토리 투표 유도', hook: '이거 못 고르면 하수? 🤔' },
                { title: `현실적인 ${planTopic} 썰`, type: 'community', desc: '공감 유도 글', hook: '나만 이래? ㅠㅠ' },
                { title: `${planTopic} 유형별 특징`, type: 'insta_feed', desc: '정보성 유머', hook: '내 주변에 꼭 있다 ㅋㅋ' },
                { title: `POV: ${planTopic} 상황극`, type: 'reels_script', desc: '1인 2역 연기', hook: '소개팅 나갔는데...' },
            ];
            setPlanIdeas(ideas);
        } finally {
            setIsPlanning(false);
        }
    };


    const getTypeLabel = (type) => {
        const labels = {
            'insta_story': '📱 스토리',
            'insta_feed': '📸 피드',
            'reels_script': '🎬 릴스',
            'community': '💬 커뮤니티'
        };
        return labels[type] || type;
    };

    const getTypeColor = (type) => {
        const colors = {
            'insta_story': '#E91E63',
            'insta_feed': '#9C27B0',
            'reels_script': '#673AB7',
            'community': '#3F51B5'
        };
        return colors[type] || '#FF007A';
    };

    return (
        <div className="custom-scrollbar" style={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            padding: '32px'
        }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', paddingTop: '48px', paddingBottom: '32px' }}>
                    <h3 style={{
                        fontSize: '28px',
                        fontWeight: '800',
                        color: '#1E293B',
                        marginBottom: '12px'
                    }}>
                        💡 아이디어 랩에서 주제를 정해보세요!
                    </h3>
                    <p style={{ color: '#64748B', fontSize: '15px' }}>
                        키워드를 입력하면 다양한 포맷의 콘텐츠 아이디어를 제안해드려요
                    </p>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        maxWidth: '500px',
                        margin: '32px auto 0'
                    }}>
                        <input
                            type="text"
                            value={planTopic}
                            onChange={(e) => setPlanTopic(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePlanContent()}
                            placeholder="예: 썸, 소개팅, 데이트룩, 첫만남"
                            style={{
                                flex: 1,
                                padding: '16px 20px',
                                border: '2px solid #E2E8F0',
                                borderRadius: '16px 0 0 16px',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'border-color 0.15s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#FF007A'}
                            onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                        />
                        <button
                            onClick={handlePlanContent}
                            disabled={isPlanning || !planTopic}
                            style={{
                                padding: '16px 28px',
                                backgroundColor: '#FF007A',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0 16px 16px 0',
                                fontWeight: '700',
                                fontSize: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            <Sparkles size={18} />
                            {isPlanning ? '생성중...' : '아이디어 생성'}
                        </button>
                    </div>
                </div>

                {isPlanning && (
                    <div style={{
                        textAlign: 'center',
                        padding: '48px',
                        color: '#FF007A'
                    }}>
                        <div className="animate-pulse" style={{ fontSize: '15px', fontWeight: '500' }}>
                            ✨ 아이디어를 생각하고 있습니다...
                        </div>
                    </div>
                )}

                {planIdeas.length > 0 && (
                    <div className="animate-fade-in" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '16px',
                        marginTop: '16px'
                    }}>
                        {planIdeas.map((idea, idx) => (
                            <div
                                key={idx}
                                onClick={() => onUseIdea(idea)}
                                className="animate-fade-in-up"
                                style={{
                                    backgroundColor: 'white',
                                    padding: '24px',
                                    borderRadius: '20px',
                                    border: '1px solid #E2E8F0',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    animationDelay: `${idx * 0.1}s`
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.borderColor = '#FF007A';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,0,122,0.12)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.borderColor = '#E2E8F0';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '12px'
                                }}>
                                    <span style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: getTypeColor(idea.type),
                                        backgroundColor: `${getTypeColor(idea.type)}15`,
                                        padding: '4px 10px',
                                        borderRadius: '8px'
                                    }}>
                                        {getTypeLabel(idea.type)}
                                    </span>
                                    <ArrowRight size={16} color="#94A3B8" />
                                </div>
                                <div style={{
                                    fontWeight: '700',
                                    fontSize: '17px',
                                    color: '#1E293B',
                                    marginBottom: '8px'
                                }}>
                                    {idea.title}
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    color: '#64748B',
                                    marginBottom: '4px'
                                }}>
                                    {idea.desc}
                                </div>
                                <div style={{
                                    fontSize: '15px',
                                    color: '#FF007A',
                                    fontWeight: '600',
                                    marginTop: '12px',
                                    padding: '8px 12px',
                                    backgroundColor: '#FDF2F8',
                                    borderRadius: '8px'
                                }}>
                                    "{idea.hook}"
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Planner;
