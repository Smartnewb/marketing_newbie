import { useState } from 'react';
import { FolderOpen, Palette, Trash2, CheckSquare, Square, X } from 'lucide-react';

function HistoryPanel({ history, onOpenItem, onDeleteItems }) {
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // 선택 모드 토글
    const toggleSelectMode = () => {
        setIsSelectMode(!isSelectMode);
        setSelectedIds(new Set());
    };

    // 개별 아이템 선택/해제
    const toggleSelect = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    // 전체 선택/해제
    const toggleSelectAll = () => {
        if (selectedIds.size === history.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(history.map(item => item.id)));
        }
    };

    // 선택된 아이템 삭제
    const handleDelete = () => {
        if (selectedIds.size === 0) return;
        if (window.confirm(`선택한 ${selectedIds.size}개의 항목을 삭제하시겠습니까?`)) {
            onDeleteItems(Array.from(selectedIds));
            setSelectedIds(new Set());
            setIsSelectMode(false);
        }
    };

    // 개별 삭제
    const handleSingleDelete = (id, e) => {
        e.stopPropagation();
        if (window.confirm('이 항목을 삭제하시겠습니까?')) {
            onDeleteItems([id]);
        }
    };

    return (
        <div className="custom-scrollbar" style={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            padding: '32px'
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {/* 상단 툴바 */}
                {history.length > 0 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        padding: '12px 16px',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '14px', color: '#64748B' }}>
                                총 {history.length}개
                            </span>
                            {isSelectMode && selectedIds.size > 0 && (
                                <span style={{
                                    fontSize: '13px',
                                    color: '#7A4AE2',
                                    fontWeight: '600',
                                    backgroundColor: '#F3E8FF',
                                    padding: '4px 10px',
                                    borderRadius: '20px'
                                }}>
                                    {selectedIds.size}개 선택됨
                                </span>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            {isSelectMode ? (
                                <>
                                    <button
                                        onClick={toggleSelectAll}
                                        style={{
                                            padding: '8px 14px',
                                            backgroundColor: '#F1F5F9',
                                            color: '#64748B',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        {selectedIds.size === history.length ? (
                                            <><CheckSquare size={16} /> 전체 해제</>
                                        ) : (
                                            <><Square size={16} /> 전체 선택</>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={selectedIds.size === 0}
                                        style={{
                                            padding: '8px 14px',
                                            backgroundColor: selectedIds.size > 0 ? '#FEE2E2' : '#F1F5F9',
                                            color: selectedIds.size > 0 ? '#DC2626' : '#94A3B8',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <Trash2 size={16} /> 삭제
                                    </button>
                                    <button
                                        onClick={toggleSelectMode}
                                        style={{
                                            padding: '8px 14px',
                                            backgroundColor: '#F1F5F9',
                                            color: '#64748B',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <X size={16} /> 취소
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={toggleSelectMode}
                                    style={{
                                        padding: '8px 14px',
                                        backgroundColor: '#F1F5F9',
                                        color: '#64748B',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <CheckSquare size={16} /> 선택
                                </button>
                            )}
                        </div>
                    </div>
                )}

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
                                onClick={() => isSelectMode && toggleSelect(item.id)}
                                style={{
                                    backgroundColor: 'white',
                                    padding: '16px',
                                    borderRadius: '16px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    border: selectedIds.has(item.id)
                                        ? '2px solid #7A4AE2'
                                        : '1px solid #E2E8F0',
                                    transition: 'all 0.2s ease',
                                    cursor: isSelectMode ? 'pointer' : 'default',
                                    position: 'relative'
                                }}
                                onMouseOver={e => {
                                    if (!isSelectMode) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                                    }
                                }}
                                onMouseOut={e => {
                                    if (!isSelectMode) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                    }
                                }}
                            >
                                {/* 선택 체크박스 */}
                                {isSelectMode && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '12px',
                                        left: '12px',
                                        zIndex: 5,
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '6px',
                                        backgroundColor: selectedIds.has(item.id) ? '#7A4AE2' : 'white',
                                        border: selectedIds.has(item.id) ? 'none' : '2px solid #CBD5E1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                        {selectedIds.has(item.id) && (
                                            <CheckSquare size={16} color="white" />
                                        )}
                                    </div>
                                )}

                                {/* 개별 삭제 버튼 (선택 모드가 아닐 때) */}
                                {!isSelectMode && (
                                    <button
                                        onClick={(e) => handleSingleDelete(item.id, e)}
                                        style={{
                                            position: 'absolute',
                                            top: '12px',
                                            right: '12px',
                                            zIndex: 5,
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '8px',
                                            backgroundColor: 'rgba(255,255,255,0.9)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: 0.7,
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={e => {
                                            e.currentTarget.style.opacity = '1';
                                            e.currentTarget.style.backgroundColor = '#FEE2E2';
                                        }}
                                        onMouseOut={e => {
                                            e.currentTarget.style.opacity = '0.7';
                                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)';
                                        }}
                                    >
                                        <Trash2 size={14} color="#DC2626" />
                                    </button>
                                )}

                                <div style={{
                                    height: '180px',
                                    backgroundColor: '#F1F5F9',
                                    borderRadius: '12px',
                                    marginBottom: '16px',
                                    overflow: 'hidden',
                                    opacity: isSelectMode && selectedIds.has(item.id) ? 0.8 : 1
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
                                {!isSelectMode && (
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
                                )}
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
