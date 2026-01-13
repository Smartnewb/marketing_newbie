import React, { useState } from 'react';
import { PenTool, ImageIcon, Send, Palette, User, Users, MapPin, Sparkles, RefreshCw, Wand2, RatioIcon } from 'lucide-react';

const ASPECT_RATIOS = [
    { name: '1:1', value: '1:1', width: 800, height: 800 },
    { name: '4:5', value: '4:5', width: 800, height: 1000 },
    { name: '9:16', value: '9:16', width: 720, height: 1280 },
    { name: '16:9', value: '16:9', width: 1280, height: 720 },
    { name: '3:4', value: '3:4', width: 768, height: 1024 }
];

function Creator({ topic, setTopic, generatedImageUrl, setGeneratedImageUrl, onSendToStudio }) {
    const [isGeneratingText, setIsGeneratingText] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [currentPrompt, setCurrentPrompt] = useState('');
    const [refineInput, setRefineInput] = useState('');
    const [customPrompt, setCustomPrompt] = useState('');
    const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);

    const [imgSettings, setImgSettings] = useState({
        count: '1',
        gender: 'female',
        age: '20대 초반',
        country: 'Korean',
        situation: '',
        background: '',
        aspectRatio: '1:1'
    });

    const handleGenerateText = async () => {
        if (!topic) return;
        setIsGeneratingText(true);

        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

        if (!apiKey) {
            // Fallback to mock data if no API key
            setTimeout(() => {
                const templates = [
                    `${topic}에 대한 솔직한 이야기! 💕\n\n요즘 이게 진짜 트렌드인 거 알죠?\n\n📌 핵심 포인트\n1. 첫인상이 90%를 결정한다\n2. 자연스러움이 최고의 무기\n3. 센스있는 리액션은 필수!\n\n#${topic.replace(/\s/g, '')} #소개팅 #연애 #20대`,
                    `[${topic}] 이것만 알면 성공률 2배! 🔥\n\n솔직히 말해서 다들 이거 몰라서 실패함\n진짜 실전에서 써먹을 수 있는 팁만 모았어\n\n✓ 핵심만 짧게\n✓ TMI는 나중에\n✓ 호감 표현은 과감하게\n\n#연애꿀팁 #${topic.replace(/\s/g, '')}`
                ];
                setGeneratedContent(templates[Math.floor(Math.random() * templates.length)]);
                setIsGeneratingText(false);
            }, 1200);
            return;
        }

        try {
            console.log('OpenAI 카피라이팅 API 호출 시작...', { apiKey: apiKey ? '있음' : '없음' });

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
                            content: `당신은 대학생/사회초년생 타겟 소개팅 앱의 인스타그램 마케팅 카피라이터입니다.
                            20대의 언어 습관과 밈, '외로움', '설렘' 등의 감성 키워드를 잘 활용합니다.
                            짧고 임팩트 있는 문구를 작성하며, 적절한 이모지와 해시태그를 포함합니다.`
                        },
                        {
                            role: 'user',
                            content: `"${topic}" 주제로 인스타그램 피드용 마케팅 카피를 작성해주세요.
                            
                            형식:
                            - 임팩트 있는 첫 줄 (Hook)
                            - 본문 (3-4줄, 공감 유도)
                            - 핵심 포인트 리스트 (이모지 포함)
                            - 해시태그 5개 이상
                            
                            20대 대학생이 공감할 수 있는 톤으로 작성해주세요.`
                        }
                    ],
                    temperature: 0.9,
                    max_tokens: 500
                })
            });

            console.log('OpenAI Response status:', response.status);

            const data = await response.json();
            console.log('OpenAI Response data:', data);

            if (!response.ok) {
                throw new Error(data.error?.message || `HTTP ${response.status}`);
            }

            const content = data.choices[0].message.content;
            console.log('OpenAI Content:', content);
            setGeneratedContent(content);
        } catch (error) {
            console.error('OpenAI API Error:', error);
            // Fallback to mock data on error
            setGeneratedContent(`${topic}에 대한 솔직한 이야기! 💕\n\n요즘 이게 진짜 트렌드인 거 알죠?\n\n📌 핵심 포인트\n1. 첫인상이 90%를 결정한다\n2. 자연스러움이 최고의 무기\n\n#${topic.replace(/\s/g, '')} #소개팅 #연애`);
        } finally {
            setIsGeneratingText(false);
        }
    };

    // GPT-5.2로 프롬프트 향상
    const enhancePromptWithGPT = async (userPrompt) => {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) return userPrompt;

        try {
            setIsEnhancingPrompt(true);
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
                            content: `You are an expert at creating detailed image generation prompts for realistic portrait photography. 
                            Enhance the user's prompt to create a highly detailed, photorealistic image description.
                            Focus on: lighting, camera settings, mood, facial expressions, and professional photography aesthetics.
                            The images should look like professional dating app photos - attractive, natural, and approachable.
                            Keep the output under 200 words. Output only the enhanced prompt, nothing else.`
                        },
                        {
                            role: 'user',
                            content: `Enhance this image prompt for a dating app marketing photo: "${userPrompt}"`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 300
                })
            });

            const data = await response.json();
            if (data.choices && data.choices[0]) {
                return data.choices[0].message.content;
            }
            return userPrompt;
        } catch (error) {
            console.error('Prompt enhancement error:', error);
            return userPrompt;
        } finally {
            setIsEnhancingPrompt(false);
        }
    };

    const handleGenerateImage = async () => {
        setIsGeneratingImage(true);

        const { count, gender, age, country, situation, background, aspectRatio } = imgSettings;
        const ratioConfig = ASPECT_RATIOS.find(r => r.value === aspectRatio) || ASPECT_RATIOS[0];

        let finalPrompt = '';

        // 커스텀 프롬프트가 있으면 GPT-5.2로 향상시키기
        if (customPrompt.trim()) {
            finalPrompt = await enhancePromptWithGPT(customPrompt);
        } else {
            // 기존 설정 기반 프롬프트 생성
            const genderMap = {
                'female': 'woman',
                'male': 'man',
                'mixed': 'couple'
            };

            const peopleDesc = `${count === '1' ? 'a single' : count} ${age} ${country} ${genderMap[gender] || 'person'}`;
            const contextDesc = situation ? `, ${situation}` : '';
            const bgDesc = background ? `, in ${background}` : '';

            finalPrompt = `realistic photo of ${peopleDesc}${contextDesc}${bgDesc}, highly detailed face, 8k, photorealistic, cinematic lighting, shot on 35mm lens, depth of field, dating app aesthetic, natural lighting, high quality portrait, professional photography`;
        }

        setCurrentPrompt(finalPrompt);

        const arkApiKey = import.meta.env.VITE_ARK_API_KEY;

        if (arkApiKey) {
            // Use Seedream 4.5 API with aspect ratio
            try {
                const response = await fetch('/api/seedream', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${arkApiKey}`
                    },
                    body: JSON.stringify({
                        model: 'seedream-4-5-251128',
                        prompt: finalPrompt,
                        sequential_image_generation: 'disabled',
                        response_format: 'url',
                        size: '2K',
                        stream: false,
                        watermark: false
                    })
                });

                const data = await response.json();

                if (data.data && data.data[0] && data.data[0].url) {
                    setGeneratedImageUrl(data.data[0].url);
                } else {
                    throw new Error('No image URL in response');
                }
            } catch (error) {
                console.error('Seedream API Error:', error);
                // Fallback to Pollinations
                const encodedPrompt = encodeURIComponent(basePrompt);
                const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
                setGeneratedImageUrl(url);
            }
        } else {
            // Fallback to Pollinations API
            const encodedPrompt = encodeURIComponent(basePrompt);
            const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
            setTimeout(() => {
                setGeneratedImageUrl(url);
            }, 1500);
        }

        setIsGeneratingImage(false);
    };

    const handleRefineImage = async () => {
        if (!refineInput || !currentPrompt) return;
        setIsGeneratingImage(true);

        const newPrompt = `${currentPrompt}, ${refineInput}`;
        setCurrentPrompt(newPrompt);

        const arkApiKey = import.meta.env.VITE_ARK_API_KEY;

        if (arkApiKey) {
            // Use Seedream 4.5 API
            try {
                const response = await fetch('/api/seedream', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${arkApiKey}`
                    },
                    body: JSON.stringify({
                        model: 'seedream-4-5-251128',
                        prompt: newPrompt,
                        sequential_image_generation: 'disabled',
                        response_format: 'url',
                        size: '2K',
                        stream: false,
                        watermark: false
                    })
                });

                const data = await response.json();

                if (data.data && data.data[0] && data.data[0].url) {
                    setGeneratedImageUrl(data.data[0].url);
                } else {
                    throw new Error('No image URL in response');
                }
            } catch (error) {
                console.error('Seedream API Error:', error);
                // Fallback to Pollinations
                const encodedPrompt = encodeURIComponent(newPrompt);
                const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
                setGeneratedImageUrl(url);
            }
        } else {
            // Fallback to Pollinations API
            const encodedPrompt = encodeURIComponent(newPrompt);
            const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
            setTimeout(() => {
                setGeneratedImageUrl(url);
            }, 1500);
        }

        setRefineInput('');
        setIsGeneratingImage(false);
    };

    return (
        <div className="custom-scrollbar" style={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            padding: '24px'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                gap: '24px',
                height: 'calc(100% - 48px)'
            }}>

                {/* Left Panel - Controls */}
                <div style={{
                    width: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    flexShrink: 0
                }}>

                    {/* Text Generation */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '20px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        border: '1px solid #E2E8F0'
                    }}>
                        <h3 style={{
                            fontWeight: '700',
                            color: '#1E293B',
                            marginBottom: '16px',
                            fontSize: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <PenTool size={18} color="#FF007A" /> 텍스트 생성
                        </h3>
                        <input
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            placeholder="주제 입력 (예: 첫만남, 썸남)"
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                border: '1px solid #E2E8F0',
                                borderRadius: '12px',
                                marginBottom: '12px',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#FF007A'}
                            onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                        />
                        <button
                            onClick={handleGenerateText}
                            disabled={isGeneratingText || !topic}
                            style={{
                                width: '100%',
                                padding: '14px',
                                backgroundColor: '#1E293B',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: '600',
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Sparkles size={16} />
                            {isGeneratingText ? '생성중...' : '카피라이팅 생성'}
                        </button>
                        <textarea
                            value={generatedContent}
                            readOnly
                            placeholder="결과가 여기에 표시됩니다."
                            style={{
                                width: '100%',
                                marginTop: '12px',
                                padding: '14px',
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: '12px',
                                height: '100px',
                                fontSize: '13px',
                                resize: 'none',
                                outline: 'none',
                                lineHeight: '1.6'
                            }}
                        />
                    </div>

                    {/* Image Generation */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '20px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        border: '1px solid #E2E8F0',
                        flex: 1
                    }}>
                        <h3 style={{
                            fontWeight: '700',
                            color: '#1E293B',
                            marginBottom: '16px',
                            fontSize: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <ImageIcon size={18} color="#FF007A" /> 현실적 인물 이미지 생성
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>
                                        <User size={12} style={{ marginRight: '4px' }} />인원
                                    </label>
                                    <select
                                        value={imgSettings.count}
                                        onChange={e => setImgSettings({ ...imgSettings, count: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '10px',
                                            fontSize: '13px',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        <option value="1">1명</option>
                                        <option value="2">2명 (커플)</option>
                                        <option value="group of">여러 명</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>
                                        <Users size={12} style={{ marginRight: '4px' }} />성별
                                    </label>
                                    <select
                                        value={imgSettings.gender}
                                        onChange={e => setImgSettings({ ...imgSettings, gender: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '10px',
                                            fontSize: '13px',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        <option value="female">여성</option>
                                        <option value="male">남성</option>
                                        <option value="mixed">혼성</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>나이대</label>
                                    <input
                                        type="text"
                                        value={imgSettings.age}
                                        onChange={e => setImgSettings({ ...imgSettings, age: e.target.value })}
                                        placeholder="예: 20대 초반"
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '10px',
                                            fontSize: '13px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>국적/스타일</label>
                                    <input
                                        type="text"
                                        value={imgSettings.country}
                                        onChange={e => setImgSettings({ ...imgSettings, country: e.target.value })}
                                        placeholder="예: Korean"
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '10px',
                                            fontSize: '13px'
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>상황 (행동)</label>
                                <input
                                    type="text"
                                    value={imgSettings.situation}
                                    onChange={e => setImgSettings({ ...imgSettings, situation: e.target.value })}
                                    placeholder="예: drinking coffee, laughing, reading"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '10px',
                                        fontSize: '13px'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>
                                    <MapPin size={12} style={{ marginRight: '4px' }} />배경 장소
                                </label>
                                <input
                                    type="text"
                                    value={imgSettings.background}
                                    onChange={e => setImgSettings({ ...imgSettings, background: e.target.value })}
                                    placeholder="예: cafe, campus, park, night street"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '10px',
                                        fontSize: '13px'
                                    }}
                                />
                            </div>

                            {/* Custom Prompt */}
                            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px', marginTop: '4px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>
                                    <Wand2 size={12} style={{ marginRight: '4px' }} />직접 프롬프트 작성 (선택)
                                </label>
                                <textarea
                                    value={customPrompt}
                                    onChange={e => setCustomPrompt(e.target.value)}
                                    placeholder="직접 원하는 이미지를 설명하세요. GPT-5.2가 프롬프트를 자동으로 향상시킵니다. (예: 카페에서 웃고있는 20대 여성, 따뜻한 조명)"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '10px',
                                        fontSize: '13px',
                                        resize: 'vertical',
                                        minHeight: '80px',
                                        lineHeight: '1.5',
                                        backgroundColor: '#FEFCE8'
                                    }}
                                />
                                <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
                                    ✨ GPT-5.2가 입력한 설명을 전문 사진 프롬프트로 향상시킵니다
                                </div>
                            </div>

                            {/* Aspect Ratio */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '6px' }}>
                                    📐 이미지 비율
                                </label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {ASPECT_RATIOS.map(ratio => (
                                        <button
                                            key={ratio.value}
                                            onClick={() => setImgSettings({ ...imgSettings, aspectRatio: ratio.value })}
                                            style={{
                                                flex: 1,
                                                padding: '8px 4px',
                                                fontSize: '11px',
                                                fontWeight: imgSettings.aspectRatio === ratio.value ? '700' : '500',
                                                borderRadius: '8px',
                                                border: imgSettings.aspectRatio === ratio.value ? '2px solid #FF007A' : '1px solid #E2E8F0',
                                                backgroundColor: imgSettings.aspectRatio === ratio.value ? '#FDF2F8' : 'white',
                                                color: imgSettings.aspectRatio === ratio.value ? '#FF007A' : '#64748B',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            {ratio.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateImage}
                            disabled={isGeneratingImage || isEnhancingPrompt}
                            style={{
                                width: '100%',
                                padding: '16px',
                                marginTop: '16px',
                                background: 'linear-gradient(135deg, #FF007A 0%, #FF5BA3 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: '700',
                                fontSize: '14px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 16px rgba(255,0,122,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                opacity: (isGeneratingImage || isEnhancingPrompt) ? 0.7 : 1
                            }}
                        >
                            {isEnhancingPrompt ? (
                                <>
                                    <Wand2 size={16} className="animate-pulse" /> 프롬프트 향상중...
                                </>
                            ) : isGeneratingImage ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" /> 사진 촬영중...
                                </>
                            ) : (
                                <>
                                    <ImageIcon size={16} /> 고화질 실사 생성
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Panel - Image Result */}
                <div style={{
                    flex: 1,
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    border: '1px solid #E2E8F0',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0
                }}>
                    {generatedImageUrl ? (
                        <>
                            <div style={{
                                flex: 1,
                                backgroundColor: '#F8FAFC',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                marginBottom: '16px',
                                minHeight: 0
                            }}>
                                <img
                                    src={generatedImageUrl}
                                    alt="Generated"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        value={refineInput}
                                        onChange={(e) => setRefineInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRefineImage()}
                                        placeholder="AI에게 수정 요청 (예: 배경을 밤으로 바꿔줘, 웃는 표정으로)"
                                        style={{
                                            flex: 1,
                                            padding: '14px 16px',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '12px',
                                            fontSize: '14px',
                                            outline: 'none'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#FF007A'}
                                        onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                                    />
                                    <button
                                        onClick={handleRefineImage}
                                        disabled={isGeneratingImage || !refineInput}
                                        style={{
                                            padding: '14px 20px',
                                            backgroundColor: '#F1F5F9',
                                            border: 'none',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Send size={18} color="#64748B" />
                                    </button>
                                </div>

                                <button
                                    onClick={() => onSendToStudio(generatedImageUrl, topic)}
                                    style={{
                                        width: '100%',
                                        padding: '18px',
                                        backgroundColor: '#FF007A',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '14px',
                                        fontWeight: '700',
                                        fontSize: '15px',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 20px rgba(255,0,122,0.25)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <Palette size={18} /> 디자인 스튜디오에서 꾸미기
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#CBD5E1'
                        }}>
                            <ImageIcon size={72} style={{ marginBottom: '16px', opacity: 0.4 }} />
                            <p style={{ fontSize: '16px', fontWeight: '500' }}>
                                현실적인 인물 사진을
                            </p>
                            <p style={{ fontSize: '16px', fontWeight: '500' }}>
                                생성해보세요.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Creator;
