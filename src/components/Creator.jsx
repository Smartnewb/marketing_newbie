import React, { useState } from 'react';
import { PenTool, ImageIcon, Send, Palette, User, Users, MapPin, Sparkles, RefreshCw, Wand2, RatioIcon, FolderPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { UsageTracker } from '../utils/UsageTracker';

const ASPECT_RATIOS = [
    { name: '1:1', value: '1:1', width: 800, height: 800 },
    { name: '4:5', value: '4:5', width: 800, height: 1000 },
    { name: '9:16', value: '9:16', width: 720, height: 1280 },
    { name: '16:9', value: '16:9', width: 1280, height: 720 },
    { name: '3:4', value: '3:4', width: 768, height: 1024 }
];

// 한국어 → 영어 키워드 번역 딕셔너리 (API 비용 절약)
// 주의: 부분 매칭 문제를 피하기 위해 2글자 이상의 명확한 키워드만 사용
const KO_EN_DICTIONARY = {
    // 인물
    '여성': 'woman', '여자': 'woman', '남성': 'man', '남자': 'man', '커플': 'couple',
    '20대 초반': 'early 20s', '20대 후반': 'late 20s', '20대': 'in their 20s',
    '30대': 'in their 30s', '10대': 'teenager',
    '대학생': 'college student', '직장인': 'office worker', '사회초년생': 'young professional',
    '한국인': 'Korean', '한국 사람': 'Korean person', '동양인': 'Asian', '서양인': 'Western',
    // 표정/행동
    '웃는': 'smiling', '웃고있는': 'smiling', '미소': 'smiling', '밝은 표정': 'bright cheerful expression',
    '행복한': 'happy', '설레는': 'excited romantic', '수줍은': 'shy', '당당한': 'confident',
    '셀카': 'selfie', '포즈': 'posing',
    // 장소
    '카페에서': 'at cozy cafe', '카페': 'cozy cafe', '커피숍': 'coffee shop', '캠퍼스': 'university campus',
    '도서관': 'library', '공원에서': 'at park', '공원': 'park', '거리에서': 'on street', '야경': 'night city view',
    '바다에서': 'at beach', '바다': 'beach ocean', '산에서': 'at mountain', '레스토랑': 'restaurant', '술집': 'bar lounge',
    '집에서': 'at cozy home', '방에서': 'in cozy room', '침실': 'bedroom',
    // 분위기
    '따뜻한': 'warm', '차가운': 'cool', '로맨틱한': 'romantic', '로맨틱': 'romantic', '감성적인': 'aesthetic moody',
    '트렌디한': 'trendy modern', '트렌디': 'trendy modern', '빈티지': 'vintage retro', '깔끔한': 'clean minimal',
    '자연스러운': 'natural candid', '일상적인': 'everyday lifestyle',
    // 조명
    '조명': 'lighting', '햇살': 'sunlight golden hour', '야간에': 'at night', '낮에': 'in daytime',
    // 옷차림
    '캐주얼': 'casual outfit', '정장': 'formal suit', '원피스': 'dress', '청바지': 'jeans',
    // 소품 (명확한 문맥이 있는 표현만)
    '커피 마시는': 'holding coffee cup', '커피를 마시는': 'holding coffee cup',
    '핸드폰 보는': 'looking at phone', '책 읽는': 'reading book', '책을 읽는': 'reading book',
    '노트북': 'using laptop', '꽃다발': 'flowers bouquet', '선글라스': 'sunglasses',
    // 계절/날씨 (명확한 표현만)
    '봄날': 'spring day', '여름날': 'summer day', '가을날': 'autumn day', '겨울날': 'winter day',
    '눈 오는': 'snowing', '비 오는': 'rainy', '맑은 날': 'sunny clear day',
};

// 한국어를 영어로 변환하는 함수 (API 없이 딕셔너리 사용)
const translateKoreanToEnglish = (koreanText) => {
    let result = koreanText;

    // 딕셔너리의 모든 한국어 키워드를 영어로 치환
    Object.entries(KO_EN_DICTIONARY).forEach(([ko, en]) => {
        const regex = new RegExp(ko, 'g');
        result = result.replace(regex, en);
    });

    // 기본 프롬프트 추가 (고품질 이미지 생성을 위해)
    const basePrompt = 'realistic photo, highly detailed face, 8k, photorealistic, cinematic lighting, professional photography, natural lighting';

    return `${result}, ${basePrompt}`;
};

function Creator({ topic, setTopic, generatedImageUrl, setGeneratedImageUrl, onSendToStudio, onSaveToHistory }) {
    const [isGeneratingText, setIsGeneratingText] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [currentPrompt, setCurrentPrompt] = useState('');
    const [refineInput, setRefineInput] = useState('');
    const [imagePrompt, setImagePrompt] = useState('한국인 20대 초반 남자 또는 여자'); // 기본값: 한국인 20대 초반
    const [aspectRatio, setAspectRatio] = useState('3:4'); // 기본값: 세로 비율
    const [imageHistory, setImageHistory] = useState([]); // 이미지 히스토리 (세션 내)
    const [historyIndex, setHistoryIndex] = useState(-1); // 현재 보고 있는 이미지 인덱스

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
            // Log OpenAI 텍스트 생성 비용
            UsageTracker.logTextUsage('gpt-5.2', 200, 500, 'marketing_newbie', '제작 (텍스트)');
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
                // Log 프롬프트 향상 비용
                UsageTracker.logTextUsage('gpt-5.2', 100, 300, 'marketing_newbie', '프롬프트 향상');
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

    // 히스토리에 이미지 추가하는 함수
    const addToHistory = (url) => {
        setImageHistory(prev => {
            const newHistory = [...prev, url];
            setHistoryIndex(newHistory.length - 1); // 최신 이미지로 이동
            return newHistory;
        });
    };

    // 이전 이미지로 이동
    const goToPrevImage = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setGeneratedImageUrl(imageHistory[newIndex]);
        }
    };

    // 다음 이미지로 이동
    const goToNextImage = () => {
        if (historyIndex < imageHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setGeneratedImageUrl(imageHistory[newIndex]);
        }
    };

    const handleGenerateImage = async () => {
        if (!imagePrompt.trim()) return;

        setIsGeneratingImage(true);
        const ratioConfig = ASPECT_RATIOS.find(r => r.value === aspectRatio) || ASPECT_RATIOS[0];

        // 한국어 → 영어 변환 (API 비용 없이 딕셔너리 사용)
        const finalPrompt = translateKoreanToEnglish(imagePrompt);
        console.log('원본 프롬프트:', imagePrompt);
        console.log('변환된 프롬프트:', finalPrompt);

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
                        aspect_ratio: aspectRatio,
                        stream: false,
                        watermark: false
                    })
                });

                const data = await response.json();

                if (data.data && data.data[0] && data.data[0].url) {
                    const newUrl = data.data[0].url;
                    setGeneratedImageUrl(newUrl);
                    addToHistory(newUrl);
                    // Log Seedream 이미지 생성 비용
                    UsageTracker.logImageUsage('seedream-4-5', 1, 'marketing_newbie', '제작 (이미지)');
                } else {
                    throw new Error('No image URL in response');
                }
            } catch (error) {
                console.error('Seedream API Error:', error);
                // Fallback to Pollinations with correct dimensions
                const encodedPrompt = encodeURIComponent(finalPrompt);
                const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${ratioConfig.width}&height=${ratioConfig.height}&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
                setGeneratedImageUrl(url);
                addToHistory(url);
            }
        } else {
            // Fallback to Pollinations API with correct dimensions
            const encodedPrompt = encodeURIComponent(finalPrompt);
            const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${ratioConfig.width}&height=${ratioConfig.height}&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
            setTimeout(() => {
                setGeneratedImageUrl(url);
                addToHistory(url);
            }, 1500);
        }

        setIsGeneratingImage(false);
    };

    const handleRefineImage = async () => {
        if (!refineInput || !currentPrompt) return;
        setIsGeneratingImage(true);

        const newPrompt = `${currentPrompt}, ${refineInput}`;
        setCurrentPrompt(newPrompt);

        const ratioConfig = ASPECT_RATIOS.find(r => r.value === aspectRatio) || ASPECT_RATIOS[0];

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
                        prompt: newPrompt,
                        sequential_image_generation: 'disabled',
                        response_format: 'url',
                        size: '2K',
                        aspect_ratio: aspectRatio,
                        stream: false,
                        watermark: false
                    })
                });

                const data = await response.json();

                if (data.data && data.data[0] && data.data[0].url) {
                    const newUrl = data.data[0].url;
                    setGeneratedImageUrl(newUrl);
                    addToHistory(newUrl);
                    // Log Seedream 이미지 수정 비용
                    UsageTracker.logImageUsage('seedream-4-5', 1, 'marketing_newbie', '제작 (이미지 수정)');
                } else {
                    throw new Error('No image URL in response');
                }
            } catch (error) {
                console.error('Seedream API Error:', error);
                // Fallback to Pollinations with aspect ratio
                const encodedPrompt = encodeURIComponent(newPrompt);
                const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${ratioConfig.width}&height=${ratioConfig.height}&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
                setGeneratedImageUrl(url);
                addToHistory(url);
            }
        } else {
            // Fallback to Pollinations API with aspect ratio
            const encodedPrompt = encodeURIComponent(newPrompt);
            const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${ratioConfig.width}&height=${ratioConfig.height}&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
            setTimeout(() => {
                setGeneratedImageUrl(url);
                addToHistory(url);
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
                            <PenTool size={18} color="#7A4AE2" /> 텍스트 생성
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
                            onFocus={(e) => e.target.style.borderColor = '#7A4AE2'}
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
                            <ImageIcon size={18} color="#7A4AE2" /> 현실적 인물 이미지 생성
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* 간소화된 프롬프트 입력 */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1E293B', marginBottom: '8px' }}>
                                    ✨ 원하는 이미지를 한국어로 설명하세요
                                </label>
                                <textarea
                                    value={imagePrompt}
                                    onChange={e => setImagePrompt(e.target.value)}
                                    placeholder="예: 카페에서 커피 마시며 웃는 20대 한국인 여성, 따뜻한 조명, 감성적인 분위기"
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        border: '2px solid #E2E8F0',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        resize: 'vertical',
                                        minHeight: '100px',
                                        lineHeight: '1.6',
                                        backgroundColor: '#FEFCE8',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#7A4AE2'}
                                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                                />
                                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '8px', lineHeight: '1.5' }}>
                                    💡 <strong>팁:</strong> 인물, 장소, 분위기, 행동 등을 자유롭게 입력하세요.<br />
                                    예) "캠퍼스에서 책 읽는 대학생 남자", "야경 배경의 로맨틱한 커플"
                                </div>
                            </div>

                            {/* Aspect Ratio */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '8px' }}>
                                    📐 이미지 비율
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {ASPECT_RATIOS.map(ratio => (
                                        <button
                                            key={ratio.value}
                                            onClick={() => setAspectRatio(ratio.value)}
                                            style={{
                                                flex: 1,
                                                padding: '10px 6px',
                                                fontSize: '12px',
                                                fontWeight: aspectRatio === ratio.value ? '700' : '500',
                                                borderRadius: '10px',
                                                border: aspectRatio === ratio.value ? '2px solid #7A4AE2' : '1px solid #E2E8F0',
                                                backgroundColor: aspectRatio === ratio.value ? '#F3E8FF' : 'white',
                                                color: aspectRatio === ratio.value ? '#7A4AE2' : '#64748B',
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
                            disabled={isGeneratingImage || !imagePrompt.trim()}
                            style={{
                                width: '100%',
                                padding: '16px',
                                marginTop: '16px',
                                background: (!imagePrompt.trim() || isGeneratingImage)
                                    ? '#CBD5E1'
                                    : 'linear-gradient(135deg, #7A4AE2 0%, #9E7CF0 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: '700',
                                fontSize: '14px',
                                cursor: (!imagePrompt.trim() || isGeneratingImage) ? 'not-allowed' : 'pointer',
                                boxShadow: (!imagePrompt.trim() || isGeneratingImage)
                                    ? 'none'
                                    : '0 4px 16px rgba(122,74,226,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {isGeneratingImage ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" /> 이미지 생성중...
                                </>
                            ) : (
                                <>
                                    <ImageIcon size={16} /> 이미지 생성하기
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
                                marginBottom: '8px',
                                minHeight: 0,
                                position: 'relative'
                            }}>
                                {/* 이전 이미지 버튼 - 항상 표시, 비활성화 시 반투명 */}
                                <button
                                    onClick={goToPrevImage}
                                    disabled={historyIndex <= 0}
                                    style={{
                                        position: 'absolute',
                                        left: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                        border: 'none',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        cursor: historyIndex > 0 ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 10,
                                        transition: 'all 0.2s',
                                        opacity: historyIndex > 0 ? 1 : 0.3
                                    }}
                                >
                                    <ChevronLeft size={24} color="#1E293B" />
                                </button>

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

                                {/* 다음 이미지 버튼 - 항상 표시, 비활성화 시 반투명 */}
                                <button
                                    onClick={goToNextImage}
                                    disabled={historyIndex >= imageHistory.length - 1}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                        border: 'none',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        cursor: historyIndex < imageHistory.length - 1 ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 10,
                                        transition: 'all 0.2s',
                                        opacity: historyIndex < imageHistory.length - 1 ? 1 : 0.3
                                    }}
                                >
                                    <ChevronRight size={24} color="#1E293B" />
                                </button>
                            </div>

                            {/* 이미지 히스토리 인디케이터 */}
                            {imageHistory.length > 1 && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    marginBottom: '12px'
                                }}>
                                    <span style={{ fontSize: '12px', color: '#64748B' }}>
                                        {historyIndex + 1} / {imageHistory.length}
                                    </span>
                                    <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                                        {imageHistory.map((_, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    setHistoryIndex(idx);
                                                    setGeneratedImageUrl(imageHistory[idx]);
                                                }}
                                                style={{
                                                    width: idx === historyIndex ? '16px' : '6px',
                                                    height: '6px',
                                                    borderRadius: '3px',
                                                    backgroundColor: idx === historyIndex ? '#7A4AE2' : '#CBD5E1',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

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
                                        onFocus={(e) => e.target.style.borderColor = '#7A4AE2'}
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

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={() => onSaveToHistory(generatedImageUrl, topic)}
                                        style={{
                                            flex: 1,
                                            padding: '18px',
                                            backgroundColor: '#1E293B',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '14px',
                                            fontWeight: '700',
                                            fontSize: '15px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <FolderPlus size={18} /> 보관하기
                                    </button>
                                    <button
                                        onClick={() => onSendToStudio(generatedImageUrl, topic, imgSettings.aspectRatio)}
                                        style={{
                                            flex: 1,
                                            padding: '18px',
                                            backgroundColor: '#7A4AE2',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '14px',
                                            fontWeight: '700',
                                            fontSize: '15px',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 20px rgba(122,74,226,0.25)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <Palette size={18} /> 스튜디오에서 꾸미기
                                    </button>
                                </div>
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
