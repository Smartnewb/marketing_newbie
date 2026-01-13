import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Trash2, Database, AlertCircle, CheckCircle, Lightbulb, ClipboardPaste, Save } from 'lucide-react';
import { UsageTracker } from '../utils/UsageTracker';

function Learning() {
    const [knowledgeFiles, setKnowledgeFiles] = useState([]);
    const [refImages, setRefImages] = useState([]);
    const [cost, setCost] = useState(0);
    const [pasteText, setPasteText] = useState('');
    const [pasteTitle, setPasteTitle] = useState('');

    // Mock Load Data
    useEffect(() => {
        const savedFiles = JSON.parse(localStorage.getItem('brand_knowledge_vectors') || '[]');
        setKnowledgeFiles(savedFiles);
        // Recalculate cost based on mock file size
        const totalTokens = savedFiles.reduce((acc, f) => acc + (f.size || 0), 0) / 4;
        setCost(totalTokens * (0.0001 / 1000));
    }, []);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Mock "Vectorization"
        const newFile = {
            id: Date.now(),
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'embedded',
            date: new Date().toLocaleDateString('ko-KR')
        };

        const updated = [...knowledgeFiles, newFile];
        setKnowledgeFiles(updated);
        localStorage.setItem('brand_knowledge_vectors', JSON.stringify(updated));

        // Log Cost (Embedding)
        UsageTracker.logTextUsage('text-embedding-3-small', file.size / 4, 0, 'marketing_newbie', '학습 (임베딩)');
    };

    // 텍스트 직접 붙여넣기 저장
    const handleSavePastedText = () => {
        if (!pasteText.trim()) return;

        const title = pasteTitle.trim() || `직접입력_${new Date().toLocaleTimeString('ko-KR')}`;
        const textSize = new Blob([pasteText]).size;

        const newFile = {
            id: Date.now(),
            name: title,
            size: textSize,
            type: 'text/plain',
            status: 'embedded',
            date: new Date().toLocaleDateString('ko-KR'),
            content: pasteText // 실제 텍스트 내용 저장
        };

        const updated = [...knowledgeFiles, newFile];
        setKnowledgeFiles(updated);
        localStorage.setItem('brand_knowledge_vectors', JSON.stringify(updated));

        // Log Cost (Embedding)
        UsageTracker.logTextUsage('text-embedding-3-small', textSize / 4, 0, 'marketing_newbie', '학습 (임베딩)');

        // Clear inputs
        setPasteText('');
        setPasteTitle('');
    };

    const handleDelete = (id) => {
        const updated = knowledgeFiles.filter(f => f.id !== id);
        setKnowledgeFiles(updated);
        localStorage.setItem('brand_knowledge_vectors', JSON.stringify(updated));
    };

    return (
        <div className="custom-scrollbar" style={{ padding: '32px', height: '100%', overflowY: 'auto', backgroundColor: '#F8FAFC' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1E293B', marginBottom: '8px' }}>📚 브랜드 가이드라인 학습</h1>
                    <p style={{ color: '#64748B' }}>브랜드 자료를 업로드하면 AI가 자동으로 학습하여 콘텐츠 생성에 반영합니다.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

                    {/* Main Area: Knowledge Ingestion */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* 텍스트 직접 붙여넣기 - NEW */}
                        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', border: '2px solid #7A4AE2', boxShadow: '0 4px 20px rgba(122,74,226,0.1)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ClipboardPaste size={20} color="#7A4AE2" /> 텍스트 직접 입력
                            </h3>
                            <input
                                type="text"
                                value={pasteTitle}
                                onChange={(e) => setPasteTitle(e.target.value)}
                                placeholder="제목 (예: 브랜드 톤앤매너, 카피 스타일 가이드)"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    marginBottom: '12px',
                                    outline: 'none'
                                }}
                            />
                            <textarea
                                value={pasteText}
                                onChange={(e) => setPasteText(e.target.value)}
                                placeholder="브랜드 가이드라인, 톤앤매너, 카피 예시 등을 여기에 붙여넣으세요...

예시:
- 우리 브랜드는 20대 대학생을 타겟으로 합니다
- 말투는 친근하지만 신뢰감 있게
- 이모지는 1개 이하로 사용
- 핵심 키워드: 설렘, 첫만남, 캠퍼스..."
                                style={{
                                    width: '100%',
                                    height: '150px',
                                    padding: '14px 16px',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    resize: 'vertical',
                                    outline: 'none'
                                }}
                            />
                            <button
                                onClick={handleSavePastedText}
                                disabled={!pasteText.trim()}
                                style={{
                                    width: '100%',
                                    marginTop: '12px',
                                    padding: '14px',
                                    backgroundColor: pasteText.trim() ? '#7A4AE2' : '#CBD5E1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    cursor: pasteText.trim() ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Save size={16} /> AI에게 학습시키기
                            </button>
                        </div>

                        {/* Text / PDF Upload */}
                        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={20} color="#7A4AE2" /> 파일 업로드
                            </h3>
                            <div style={{ border: '2px dashed #CBD5E1', borderRadius: '16px', padding: '24px', textAlign: 'center', backgroundColor: '#F8FAFC', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <input type="file" id="docUpload" style={{ display: 'none' }} onChange={handleFileUpload} accept=".txt,.pdf,.csv" />
                                <label htmlFor="docUpload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <UploadCloud size={20} color="#7A4AE2" />
                                    </div>
                                    <div>
                                        <span style={{ fontWeight: '600', color: '#7A4AE2' }}>클릭하여 업로드</span>
                                        <span style={{ color: '#64748B' }}> 또는 파일 드래그</span>
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>PDF, TXT, CSV (최대 10MB)</span>
                                </label>
                            </div>
                        </div>

                        {/* 학습된 파일 목록 */}
                        {knowledgeFiles.length > 0 && (
                            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', marginBottom: '16px' }}>
                                    ✅ 학습된 자료 ({knowledgeFiles.length}개)
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {knowledgeFiles.map(file => (
                                        <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#DCFCE7' }}>
                                                    <CheckCircle size={16} color="#22C55E" />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{file.name}</div>
                                                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{(file.size / 1024).toFixed(1)} KB • {file.date}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDelete(file.id)} style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Visual Reference Upload */}
                        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ImageIcon size={20} color="#7A4AE2" /> 시각적 레퍼런스
                            </h3>
                            <div style={{ border: '2px dashed #CBD5E1', borderRadius: '16px', padding: '24px', textAlign: 'center', backgroundColor: '#F8FAFC' }}>
                                <p style={{ fontSize: '14px', color: '#64748B' }}>성공적인 캠페인 이미지나 무드보드를 업로드하세요.</p>
                                <button style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white', fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
                                    이미지 선택
                                </button>
                            </div>
                        </div>

                        {/* How it's used */}
                        <div style={{ backgroundColor: '#FFFBEB', padding: '20px', borderRadius: '16px', border: '1px solid #FDE68A' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#92400E', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Lightbulb size={16} /> 어떻게 활용되나요?
                            </h4>
                            <ul style={{ fontSize: '13px', color: '#78350F', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
                                <li><strong>기획 탭</strong>: AI 파트너가 브랜드 톤앤매너를 참고해서 아이디어를 제안합니다</li>
                                <li><strong>제작 탭</strong>: 카피라이팅 생성 시 브랜드 스타일이 자동 반영됩니다</li>
                                <li><strong>이미지 생성</strong>: 시각적 레퍼런스를 참고하여 일관된 이미지 생성</li>
                            </ul>
                        </div>

                    </div>

                    {/* Sidebar: Status & Cost */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ backgroundColor: '#1E293B', padding: '24px', borderRadius: '20px', color: 'white' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#94A3B8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Database size={16} /> 학습 현황
                            </h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                                <span style={{ fontSize: '32px', fontWeight: '800' }}>{knowledgeFiles.length}</span>
                                <span style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '8px' }}>학습된 문서</span>
                            </div>
                            <div style={{ width: '100%', height: '1px', backgroundColor: '#334155', marginBottom: '16px' }}></div>
                            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#94A3B8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertCircle size={16} /> 학습 비용
                            </h4>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#A78BFA' }}>
                                ${UsageTracker.getLogs().filter(l => l.feature_id === '학습 (임베딩)').reduce((a, b) => a + b.cost, 0).toFixed(5)}
                            </div>
                            <p style={{ fontSize: '11px', color: '#64748B', marginTop: '8px' }}>
                                * 임베딩 비용은 생성 비용과 별도로 측정됩니다.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Learning;
