import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, MessageSquare, Bot, User, Send, Loader2 } from 'lucide-react';

function Planner({ onUseIdea }) {
    const [activeTab, setActiveTab] = useState('simple'); // 'simple' | 'chat'

    // Simple Mode States
    const [planTopic, setPlanTopic] = useState('');
    const [planIdeas, setPlanIdeas] = useState([]);
    const [isPlanning, setIsPlanning] = useState(false);

    // Chat Mode States
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', content: '안녕하세요! 저는 당신의 마케팅 아이디어 파트너입니다. 어떤 주제로 고민 중이신가요? 편하게 이야기해주세요! 😊' }
    ]);
    const [isChatting, setIsChatting] = useState(false);
    const chatEndRef = useRef(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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

            if (!response.ok) {
                throw new Error(data.error?.message || `HTTP ${response.status}`);
            }

            const content = data.choices[0].message.content;
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const ideas = JSON.parse(jsonMatch[0]);
                setPlanIdeas(ideas);
            } else {
                throw new Error('JSON 파싱 실패');
            }
        } catch (error) {
            console.error('OpenAI API Error:', error);
            // Fallback
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

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isChatting) return;

        const userMessage = { role: 'user', content: chatInput };
        setMessages(prev => [...prev, userMessage]);
        setChatInput('');
        setIsChatting(true);

        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

        // Mock response generator for fallbacks
        const getMockResponse = (input) => {
            const keywords = ['휴가', '여름', '여행', '바다'];
            if (keywords.some(k => input.includes(k))) {
                return "여름 휴가 시즌은 마케팅의 골든타임이죠! 🏖️\n\n1. **'디지털 디톡스' 챌린지**: 휴가 때 스마트폰 내려놓기 캠페인으로 브랜드 이미지 제고\n2. **여행 파우치 공개**: 필수템 소개하며 자연스러운 제품 노출\n3. **휴가 후유증 극복 꿀팁**: 공감대 형성\n\n이런 주제들은 어떠신가요? 구체적으로 원하시는 방향이 있다면 알려주세요!";
            }
            return "좋은 아이디어네요! 👍\n\n그 주제라면 **'비포 & 애프터'** 형식이나 **'참여형 밸런스 게임'** 스토리로 풀어보면 반응이 좋을 것 같아요.\n\n구체적으로 타겟 연령층이 어떻게 되시나요? 그에 맞춰 더 뾰족한 아이디어를 드릴게요!";
        };

        if (!apiKey) {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: getMockResponse(userMessage.content)
                }]);
                setIsChatting(false);
            }, 1000);
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
                    model: 'gpt-4o', // Try stable model first
                    messages: [
                        {
                            role: 'system',
                            content: `당신은 '마케팅 도구 뉴비'의 올인원 AI 파트너입니다. 
                            단순 아이디어 제안을 넘어, 다음과 같은 전문적인 작업을 수행할 수 있습니다:
                            
                            1. **기획(Planning)**: 캠페인 타임라인, 채널 전략, 예산 분배 등 구체적인 기획안 작성.
                            2. **사진 프롬프트(Prompting)**: Midjourney, DALL-E 등에서 사용할 수 있는 고품질의 영문/사물 묘사 프롬프트 작성.
                            3. **구조화(Structuring)**: 복잡한 내용을 표, 불렛포인트, JSON 등으로 정리.
                            4. **카피라이팅(Copywriting)**: 인스타그램 캡션, 광고 문구, 블로그 아티클 초안 작성.

                            대화 스타일:
                            - 전문적이지만 딱딱하지 않게, 20대 마케터 팀원처럼 센스 있게 대화하세요.
                            - 필요하다면 "표로 정리해드릴까요?" 또는 "프롬프트로 써드릴까요?"라고 먼저 제안하세요.
                            - Markdown 형식을 적극 활용하여 가독성을 높이세요.`
                        },
                        ...messages,
                        userMessage
                    ],
                    temperature: 0.8,
                    max_tokens: 500
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.warn('API Error, using fallback:', data);
                throw new Error(data.error?.message || 'API Error');
            }

            const aiResponse = data.choices[0].message.content;
            setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

        } catch (error) {
            console.error('Chat Error:', error);
            // Fallback to mock data instead of error message
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: getMockResponse(userMessage.content)
                }]);
            }, 500);
        } finally {
            setIsChatting(false);
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
            padding: '32px',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* Tab Switcher */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '32px',
                    gap: '8px',
                    backgroundColor: '#F1F5F9',
                    padding: '4px',
                    borderRadius: '16px',
                    width: 'fit-content',
                    margin: '0 auto 32px auto'
                }}>
                    <button
                        onClick={() => setActiveTab('simple')}
                        style={{
                            padding: '8px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            backgroundColor: activeTab === 'simple' ? 'white' : 'transparent',
                            color: activeTab === 'simple' ? '#FF007A' : '#64748B',
                            fontWeight: '700',
                            fontSize: '14px',
                            boxShadow: activeTab === 'simple' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Sparkles size={16} /> 간편 생성
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        style={{
                            padding: '8px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            backgroundColor: activeTab === 'chat' ? 'white' : 'transparent',
                            color: activeTab === 'chat' ? '#FF007A' : '#64748B',
                            fontWeight: '700',
                            fontSize: '14px',
                            boxShadow: activeTab === 'chat' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Bot size={16} /> AI 파트너
                    </button>
                </div>

                {/* Simple Mode Content */}
                {activeTab === 'simple' ? (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
                    </>
                ) : (
                    /* Chat Mode Content */
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'white',
                        borderRadius: '24px',
                        border: '1px solid #E2E8F0',
                        overflow: 'hidden',
                        height: '600px', // Fixed height for chat area
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                    }}>
                        {/* Chat Messages Area */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            backgroundColor: '#FAFAFA'
                        }}>
                            {messages.map((msg, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    alignItems: 'flex-start',
                                    gap: '12px'
                                }}>
                                    {msg.role === 'assistant' && (
                                        <div style={{
                                            width: '32px', height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: '#FF007A',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Bot size={18} color="white" />
                                        </div>
                                    )}
                                    <div style={{
                                        maxWidth: '70%',
                                        padding: '14px 18px',
                                        borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '4px 20px 20px 20px',
                                        backgroundColor: msg.role === 'user' ? '#1E293B' : 'white',
                                        color: msg.role === 'user' ? 'white' : '#1E293B',
                                        boxShadow: msg.role === 'assistant' ? '0 2px 4px rgba(0,0,0,0.05)' : '0 4px 12px rgba(30,41,59,0.2)',
                                        fontSize: '15px',
                                        lineHeight: '1.6',
                                        whiteSpace: 'pre-wrap',
                                        border: msg.role === 'assistant' ? '1px solid #E2E8F0' : 'none'
                                    }}>
                                        {msg.content}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div style={{
                                            width: '32px', height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: '#CBD5E1',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <User size={18} color="white" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isChatting && (
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '32px', height: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: '#FF007A',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <Bot size={18} color="white" />
                                    </div>
                                    <div style={{
                                        backgroundColor: 'white',
                                        padding: '12px 16px',
                                        borderRadius: '4px 20px 20px 20px',
                                        border: '1px solid #E2E8F0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <Loader2 size={16} className="animate-spin" color="#FF007A" />
                                        <span style={{ fontSize: '13px', color: '#64748B' }}>답변을 생각하고 있어요...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div style={{
                            padding: '16px 24px',
                            backgroundColor: 'white',
                            borderTop: '1px solid #E2E8F0'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: '16px',
                                padding: '8px 8px 8px 20px',
                                transition: 'all 0.2s',
                            }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#FF007A'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
                            >
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSendMessage()}
                                    placeholder="아이디어를 이야기해보세요..."
                                    style={{
                                        flex: 1,
                                        border: 'none',
                                        background: 'transparent',
                                        fontSize: '15px',
                                        outline: 'none',
                                        height: '24px'
                                    }}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!chatInput.trim() || isChatting}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        backgroundColor: (!chatInput.trim() || isChatting) ? '#CBD5E1' : '#FF007A',
                                        color: 'white',
                                        cursor: (!chatInput.trim() || isChatting) ? 'default' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '8px', textAlign: 'center' }}>
                                GPT-5.2가 마케터 관점에서 피드백을 드립니다
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Planner;
