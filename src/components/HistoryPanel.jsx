import React from 'react';
import { FolderOpen, Palette } from 'lucide-react';

function HistoryPanel({ history, onOpenItem }) {
    return (
        <div className="custom-scrollbar" style={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            padding: '32px'
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {history.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '20px'
                    }}>
                        {history.map(item => (
                            <div
                                key={item.id}
                                className="animate-fade-in"
                                style={{
                                    backgroundColor: 'white',
                                    padding: '16px',
                                    borderRadius: '16px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    border: '1px solid #E2E8F0',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseOver={e => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                }}
                            >
                                <div style={{
                                    height: '180px',
                                    backgroundColor: '#F1F5F9',
                                    borderRadius: '12px',
                                    marginBottom: '16px',
                                    overflow: 'hidden'
                                }}>
                                    <img
                                        src={item.image}
                                        alt={item.topic}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                <div style={{
                                    fontWeight: '700',
                                    color: '#1E293B',
                                    marginBottom: '4px',
                                    fontSize: '15px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {item.topic || '제목 없음'}
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#94A3B8',
                                    marginBottom: '16px'
                                }}>
                                    {item.date}
                                </div>
                                <button
                                    onClick={() => onOpenItem(item)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#F3E8FF',
                                        color: '#7A4AE2',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        transition: 'all 0.15s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#FCE7F3'}
                                    onMouseOut={e => e.currentTarget.style.backgroundColor = '#F3E8FF'}
                                >
                                    <Palette size={14} /> 스튜디오에서 열기
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '400px',
                        color: '#94A3B8'
                    }}>
                        <FolderOpen size={56} style={{ marginBottom: '16px', opacity: 0.3 }} />
                        <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>보관된 컨텐츠가 없습니다</p>
                        <p style={{ fontSize: '13px', color: '#CBD5E1' }}>디자인 스튜디오에서 작업 후 내보내기하면 여기에 저장됩니다</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default HistoryPanel;
